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
    <div style={{ padding: '20px' }}>
      <h1>Boris's Glorious Downloader</h1>
      <p><b>Status:</b> {message}</p>
      <hr/>
      <input
        type="text"
        value={url}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
        placeholder="Enter YouTube URL here, Comrade"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      
      {/* --- UPDATE THE BUTTON'S DISABLED LOGIC --- */}
      {/* The button should be disabled if downloading OR if the engine isn't ready. */}
      <button
        onClick={handleDownload}
        disabled={isDownloading || !isEngineReady}
        style={{
          width: '100%',
          padding: '12px',
          background: (isDownloading || !isEngineReady) ? 'gray' : 'red',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          cursor: (isDownloading || !isEngineReady) ? 'not-allowed' : 'pointer',
        }}
      >
        {isDownloading ? 'WORKING...' : (isEngineReady ? 'DOWNLOAD FOR THE PEOPLE' : 'ENGINE STARTING...')}
      </button>
    </div>
  );
}

export default App;