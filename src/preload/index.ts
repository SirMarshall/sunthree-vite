// frontend/public/preload.js (or wherever your preload script is)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // This function sends a command to the main process
    sendCommand: (command, payload = {}) => {
        ipcRenderer.send('engine-command', { command, payload });
    },

    // This function listens for ongoing responses from the engine
    onEngineResponse: (callback) => {
        ipcRenderer.on('engine-response', (_event, value) => callback(value));
    },

    // --- THIS IS THE NEW FUNCTION ---
    // This function listens for the one-time "engine-ready" signal
    onEngineReady: (callback) => {
        // Using .once() is best practice here, as it automatically
        // removes the listener after it has been called.
        ipcRenderer.once('engine-ready', () => callback());
    }
});