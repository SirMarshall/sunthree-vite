import { ipcMain, app, BrowserWindow, dialog } from 'electron';
import path from "path";
import { spawn, ChildProcess } from "child_process";
import os from 'os';
import http from 'http';

let pythonProcess: ChildProcess | null = null;
let win: BrowserWindow | null = null;
const isDev = !app.isPackaged; // The one true way to check

const PYTHON_PORT = 5000;
// In src/main/index.ts
function startPython(): void {
  let pythonPath: string;
  let pythonDir: string;

  if (isDev) {
    // Dev mode is unchanged
    pythonPath = 'python';
    pythonDir = path.join(__dirname, '..', '..', 'backend');
    const scriptArgs = [path.join(pythonDir, 'server.py')];
    pythonProcess = spawn(pythonPath, scriptArgs, { cwd: pythonDir });
  } else {
    // Production mode is unchanged
    const engineDirName = 'engine';
    const engineFilename = os.platform() === 'win32' ? 'engine.exe' : 'engine';
    pythonDir = path.join(process.resourcesPath, engineDirName);
    pythonPath = path.join(pythonDir, engineFilename);
    try {
      pythonProcess = spawn(pythonPath, [], { cwd: pythonDir });
    } catch (err: any) {
      dialog.showErrorBox("Engine Launch Failed!", `Could not start the engine from its packaged location.\n\nPath: ${pythonPath}\n\nError: ${err}`);
      return;
    }
  }

  if (!pythonProcess) {
    dialog.showErrorBox("Fatal Error", "Python process could not be created.");
    return;
  }

  // A flag to ensure we only send the 'ready' signal once
  let isEngineReady = false;

  // The stdout handler is now just for logging.
  pythonProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`PYTHON (stdout): ${data.toString()}`);
  });

  // --- THE FIX IS HERE ---
  // The stderr handler now listens for the ready signal.
  pythonProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString();
    console.error(`PYTHON (stderr): ${output}`); // It's good practice to use console.error for stderr

    if (!isEngineReady) {
      // We look for the exact string from your logs!
      if (output.includes('Running on http://127.0.0.1:5000')) {
        isEngineReady = true;
        console.log('✅ Python engine is ready (signal from stderr). Notifying renderer.');
        if (win) {
          win.webContents.send('engine-ready');
        }
      }
    }
  });

  pythonProcess.on('close', (code: number | null) => {
    if (code !== 0 && code !== null) {
      if (win) dialog.showErrorBox('Engine Failure', `The Python engine stopped with exit code: ${code}`);
    }
  });
}
// =======================================================
// THE NEW, HTTP-POWERED IPC LISTENER!
// =======================================================
function setupIpcListeners() {
    ipcMain.on('engine-command', async (_event, { command, payload }) => {
        const endpoint = command; // e.g., 'find-device' -> 'find-device'
        const postData = JSON.stringify(payload);

        const options = {
            hostname: '127.0.0.1',
            port: PYTHON_PORT,
            path: `/${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (win) {
                        win.webContents.send('engine-response', response);
                    }
                } catch (e) {
                    console.error("ELECTRON: Failed to parse JSON response from Python:", data);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`ELECTRON: Problem with request to Python: ${e.message}`);
            // Optionally, send an error response back to the renderer
            if (win) {
                win.webContents.send('engine-response', { type: 'error', message: e.message });
            }
        });

        // Write data to request body
        req.write(postData);
        req.end();
    });
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }

    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            isDev
              ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:*; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
              : "script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ].join(' ')
        }
      })
    })
}

app.whenReady().then(() => {
    createWindow();
    startPython();
    setupIpcListeners();
});

app.on("will-quit", () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
