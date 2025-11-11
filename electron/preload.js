// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer (ESTILO BARBERÍA - SIMPLIFICADO)
contextBridge.exposeInMainWorld('electronAPI', {
  // Información de la plataforma
  platform: process.platform,
  isElectron: true,
  
  // ============================
  // API DE BACKEND
  // ============================
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  checkBackendStatus: () => ipcRenderer.invoke('check-backend-status'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // ============================
  // API DE AUTO-UPDATER (SIMPLIFICADA)
  // ============================
  
  // Enviar comandos
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  
  downloadUpdate: () => {
    ipcRenderer.send('download-update');
  },
  
  installUpdate: () => {
    ipcRenderer.send('install-update');
  },
  
  // Escuchar eventos (UN SOLO LISTENER UNIFICADO)
  onUpdateStatus: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('update-status', subscription);
    
    // Retornar función para remover el listener
    return () => {
      ipcRenderer.removeListener('update-status', subscription);
    };
  },
  
  // Limpiar listeners
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  }
});

// Tipos para TypeScript (opcional, pero útil para documentación)
/**
 * @typedef {Object} UpdateStatus
 * @property {'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'} status
 * @property {string} message
 * @property {string} [version]
 * @property {number} [percent]
 * @property {number} [bytesPerSecond]
 * @property {number} [transferred]
 * @property {number} [total]
 * @property {string} [error]
 */