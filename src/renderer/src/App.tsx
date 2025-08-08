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
  | { type: 'download-complete'; file: string }
  | { type: 'error'; message: string };

function App() {
  const [url, setUrl] = useState('');
  const [devicePath, setDevicePath] = useState('downloads');
  const [message, setMessage] = useState('Initializing engine...');
  const [isDownloading, setIsDownloading] = useState(false);

  // --- NEW STATE VARIABLE ---
  // We need to track the engine's ready state.
  const [isEngineReady, setIsEngineReady] = useState(false);

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
        case 'download-complete':
          setIsDownloading(false);
          setMessage(`SUCCESS! File saved to: ${response.file}`);
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
      setIsEngineReady(true);
      setMessage('Engine ready. Searching for device...');
      
      // NOW that the engine is ready, we can safely send the first command.
      window.electronAPI.sendCommand('find-device');
    });

  }, []); // Empty array ensures this runs only once on mount.

  const handleDownload = () => {
    setIsDownloading(true);
    setMessage(`Command sent. Waiting for completion...`);
    window.electronAPI.sendCommand('download-video', { url, path: devicePath });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="w-full max-w-md p-8 space-y-6 bg-black bg-opacity-50 rounded-2xl shadow-lg backdrop-blur-lg border border-red-500/20"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 tracking-wider">SUUNTHREE</h1>
          <p className="text-red-400/70 mt-2"><b>Status:</b> {message}</p>
        </div>

        <input
          className="w-full px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-lg text-white placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          type="text"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL here"
        />

        <button
          onClick={handleDownload}
          disabled={isDownloading || !isEngineReady}
          className="w-full py-3 text-lg font-semibold text-white bg-red-600/80 rounded-lg hover:bg-red-700/90 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-red-500/50"
        >
          {isDownloading ? 'WORKING...' : (isEngineReady ? 'DOWNLOAD' : 'ENGINE STARTING...')}
        </button>
      </div>
    </div>
  );
}

export default App;