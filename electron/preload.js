const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  checkBackendStatus: () => ipcRenderer.invoke('check-backend-status'),
  
  // Auto-actualización
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  restartApp: () => {
    ipcRenderer.send('restart-app');
  },
  
  // Info de la app
  platform: process.platform,
  isElectron: true
});