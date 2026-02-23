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
  | { type: 'error'; message: string };

function App() {
  const [url, setUrl] = useState('');
  const [devicePath, setDevicePath] = useState('');
  const [drives, setDrives] = useState<{name: string, path: string}[]>([]);
  const [message, setMessage] = useState('Initializing engine...');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
          setDrives(response.drives || []);
          if ((response.drives || []).length > 0) {
            setMessage(`Found ${response.drives.length} removable drive(s).`);
          } else {
            setMessage('No external drives found. Using Downloads folder.');
          }
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
          <input
            className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-500/30 rounded-lg text-gray-900 dark:text-white placeholder-red-500/50 dark:placeholder-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
            type="text"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL here"
          />

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