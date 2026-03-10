import React, { useState, useEffect } from 'react';
import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: {
      sendCommand: (command: string, payload?: any) => void;
      onEngineResponse: (callback: (response: any) => void) => void;
      onEngineReady: (callback: () => void) => void; // Added here
    }
  }
}

type EngineResponse =
  | { type: 'device-found'; path: string }
  | { type: 'device-not-found' }
  | { type: 'drives-list'; drives: { name: string; path: string }[] }
  | { type: 'download-complete'; file: string }
  | { type: 'download-progress'; progress: { status: string; percent: number; speed: string; eta: string } }
  | { type: 'error'; message: string };

function App() {
  const [url, setUrl] = useState('');
  const [devicePath, setDevicePath] = useState('');
  const [drives, setDrives] = useState<{name: string, path: string}[]>([]);
  const [message, setMessage] = useState('Initializing engine...');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<{status: string, percent: number, speed: string, eta: string} | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Poll progress when downloading
  useEffect(() => {
    let interval: any;
    if (isDownloading) {
      interval = setInterval(() => {
        window.electronAPI.sendCommand('download-progress');
      }, 500);
    } else {
      setProgress(null);
    }
    return () => clearInterval(interval);
  }, [isDownloading]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // This is our radio room.
    window.electronAPI.onEngineResponse((response: EngineResponse) => {
      console.log('Response from engine:', response);

      switch (response.type) {
        case 'device-found':
          const musicPath = response.path.endsWith('/') ? `${response.path}Music/` : `${response.path}/Music/`;
          setDevicePath(musicPath);
          setMessage(`Device found! Path set to: ${musicPath}`);
          break;
        case 'device-not-found':
          setMessage(`Device not found. Will download to local folder.`);
          break;
        case 'drives-list':
          const currentDrives = response.drives || [];
          setDrives(currentDrives);
          if (currentDrives.length > 0) {
            setMessage(`Found ${currentDrives.length} removable drive(s).`);
            const firstDrive = currentDrives[0];
            const musicPath = firstDrive.path.endsWith('/') || firstDrive.path.endsWith('\\') ? `${firstDrive.path}MUSIC/` : `${firstDrive.path}/MUSIC/`;
            setDevicePath(musicPath);
          } else {
            setMessage('No external drives found. Using Downloads folder.');
            setDevicePath('downloads');
          }
          break;
        case 'download-complete':
          setIsDownloading(false);
          setMessage(`SUCCESS! File saved to: ${response.file}`);
          break;
        case 'download-progress':
          setProgress(response.progress);
          break;
        case 'error':
          setIsDownloading(false);
          setMessage(`ENGINE ERROR: ${response.message}`);
          break;
      }
    });

    // --- NEW LOGIC: LISTEN FOR THE ENGINE TO BE READY ---
    // We set up the listener for the one-time ready signal.
    window.electronAPI.onEngineReady(() => {
      console.log("React received the 'engine-ready' signal!");
      setMessage('Engine ready. Searching for devices...');
      window.electronAPI.sendCommand('list-drives');
    });

    // Also try immediately just in case engine was already ready
    window.electronAPI.sendCommand('list-drives');

  }, []); // Empty array ensures this runs only once on mount.

  const handleDownload = () => {
    if (!devicePath) {
      setMessage('Please select a download location first.');
      return;
    }
    setIsDownloading(true);
    setMessage(`Command sent. Waiting for completion...`);
    window.electronAPI.sendCommand('download-video', { url, path: devicePath });
  };

  const refreshDrives = () => {
    setMessage('Refreshing drive list...');
    window.electronAPI.sendCommand('list-drives');
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="relative w-full max-w-md p-8 space-y-6 bg-white/90 dark:bg-black/50 rounded-2xl shadow-lg backdrop-blur-lg border border-red-500/20 transition-colors duration-300"
      >
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-white/10 rounded-full transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 tracking-wider">SUUNTHREE</h1>
          <p className="text-red-700 dark:text-red-400/70 mt-2"><b>Status:</b> {message}</p>
        </div>

        <div className="space-y-4">
          <div className="relative w-full">
            <input
              className="w-full px-4 py-3 pr-12 bg-red-50 dark:bg-red-900/20 border border-red-500/30 rounded-lg text-gray-900 dark:text-white placeholder-red-500/50 dark:placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
              type="text"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL here"
            />
            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setUrl(text);
                } catch (err) {
                  console.error('Failed to read clipboard contents: ', err);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
              title="Paste from clipboard"
            >
              📋
            </button>
          </div>

          <div className="flex gap-2">
            <select
              className="flex-1 min-w-0 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-500/30 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none cursor-pointer truncate transition-colors"
              value={devicePath}
              onChange={(e) => setDevicePath(e.target.value)}
            >
              <option value="" disabled className="bg-white dark:bg-gray-900 text-gray-500">Please select download location</option>
              <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="downloads">Local Downloads Folder</option>
              {drives.map((d, i) => {
                const musicPath = d.path.endsWith('/') || d.path.endsWith('\\') ? `${d.path}MUSIC/` : `${d.path}/MUSIC/`;
                return (
                  <option key={i} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={musicPath}>
                    {d.name} ({musicPath})
                  </option>
                );
              })}
            </select>
            <button 
              onClick={refreshDrives}
              className="flex-shrink-0 px-4 bg-red-100 dark:bg-red-900/40 border border-red-500/30 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              title="Refresh Drives"
            >
              🔄
            </button>
          </div>
        </div>

        {isDownloading && progress && progress.status !== 'idle' && (
          <div className="w-full mt-4 space-y-2">
            <div className="flex justify-between text-sm font-bold text-red-900 dark:text-red-200">
              <span>{progress.status === 'starting' ? 'Preparing format...' : progress.status === 'downloading' ? 'Downloading...' : 'Converting to MP3...'}</span>
              <span>{Math.round(progress.percent)}%</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-4 dark:bg-red-900/30 overflow-hidden shadow-inner">
               <div 
                 className="bg-red-500 h-4 rounded-full transition-all duration-300 ease-out" 
                 style={{ width: `${progress.percent}%` }}
               ></div>
            </div>
            {progress.status === 'downloading' && (
              <div className="flex justify-between text-xs font-semibold text-red-700 dark:text-red-400">
                <span>Speed: {progress.speed || 'Calculating...'}</span>
                <span>Time left: {progress.eta || 'Calculating...'}</span>
              </div>
            )}
            {progress.status === 'processing' && (
               <div className="text-center text-xs font-semibold text-red-700 dark:text-red-400 mt-1">
                 Finalizing file. This might take a moment...
               </div>
            )}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading || !devicePath}
          className="w-full py-3 text-lg font-semibold text-white bg-red-600 dark:bg-red-600/80 rounded-lg hover:bg-red-700 dark:hover:bg-red-700/90 disabled:bg-gray-400 dark:disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-500/50"
        >
          {isDownloading ? 'WORKING...' : 'DOWNLOAD'}
        </button>
      </div>
    </div>
  );
}

export default App;