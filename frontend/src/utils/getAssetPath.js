// frontend/src/utils/getAssetPath.js
/**
 * Obtiene la ruta correcta para assets según el entorno
 * @param {string} path - Ruta relativa del asset (ej: 'logo-maca.png')
 * @returns {string} - Ruta completa del asset
 */
export const getAssetPath = (path) => {
  // Detectar si estamos en Electron
  const isElectron = window.electron !== undefined || 
                     navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
  
  if (isElectron) {
    // En Electron, usar ruta absoluta desde resources
    return `file://${__dirname}/${path}`;
  }
  
  // En navegador, usar ruta relativa normal
  return `/${path}`;
};

export default getAssetPath;