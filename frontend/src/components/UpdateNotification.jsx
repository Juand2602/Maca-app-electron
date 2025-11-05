import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');

  useEffect(() => {
    // Verificar si estamos en Electron
    if (!window.electronAPI) return;

    // Escuchar eventos de actualización
    window.electronAPI.onUpdateAvailable((event, info) => {
      setUpdateInfo(info);
    });

    window.electronAPI.onUpdateDownloaded((event, info) => {
      setUpdateInfo({ ...info, downloaded: true });
    });

    // Escuchar progreso de descarga
    if (window.electronAPI.onDownloadProgress) {
      window.electronAPI.onDownloadProgress((event, progress) => {
        setDownloadProgress(progress);
      });
    }

    // Escuchar estado de actualización
    if (window.electronAPI.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((event, status) => {
        setUpdateStatus(status);
      });
    }
  }, []);

  const handleCheckForUpdates = () => {
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates();
    }
  };

  const handleRestartApp = () => {
    if (window.electronAPI?.restartApp) {
      window.electronAPI.restartApp();
    }
  };

  const handleDismiss = () => {
    setUpdateInfo(null);
    setDownloadProgress(null);
  };

  if (!updateInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleCheckForUpdates}
          className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Buscar actualizaciones</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white shadow-xl rounded-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              {updateInfo.downloaded ? 'Actualización lista' : 'Actualización disponible'}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {updateInfo.downloaded
            ? `La versión ${updateInfo.version} ha sido descargada y está lista para instalar.`
            : `La versión ${updateInfo.version} está disponible. Se descargará en segundo plano.`}
        </p>

        {downloadProgress && !updateInfo.downloaded && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Descargando...</span>
              <span>{Math.round(downloadProgress.percent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(downloadProgress.transferred / 1024 / 1024).toFixed(2)} MB de{' '}
              {(downloadProgress.total / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {updateInfo.downloaded && (
          <div className="flex gap-2">
            <button
              onClick={handleRestartApp}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Reiniciar ahora
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Más tarde
            </button>
          </div>
        )}

        {updateStatus && (
          <p className="text-xs text-gray-500 mt-2">{updateStatus}</p>
        )}
      </div>
    </div>
  );
}