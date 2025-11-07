import { useEffect, useState } from 'react';
import { Download, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, downloaded, error
  const [autoUpdaterAvailable, setAutoUpdaterAvailable] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si estamos en Electron
    if (!window.electronAPI) return;

    // Verificar si auto-updater está disponible
    if (window.electronAPI.isAutoUpdaterAvailable) {
      window.electronAPI.isAutoUpdaterAvailable().then(available => {
        setAutoUpdaterAvailable(available);
        console.log('🔄 Auto-updater disponible:', available);
      });
    }

    // Escuchar cuando una actualización está disponible
    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable((info) => {
      console.log('📥 Actualización disponible:', info);
      setUpdateStatus('available');
      setUpdateInfo(info);
      setError(null);
    });

    // Escuchar cuando NO hay actualizaciones
    if (window.electronAPI.onUpdateNotAvailable) {
      const unsubscribeNotAvailable = window.electronAPI.onUpdateNotAvailable((info) => {
        console.log('✅ No hay actualizaciones disponibles');
        setUpdateStatus('idle');
        setError(null);
      });
    }

    // Escuchar progreso de descarga
    const unsubscribeProgress = window.electronAPI.onDownloadProgress?.((progress) => {
      console.log('⬇️ Progreso de descarga:', progress.percent.toFixed(2) + '%');
      setUpdateStatus('downloading');
      setDownloadProgress(progress);
    });

    // Escuchar cuando la actualización se descargó
    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      console.log('✅ Actualización descargada:', info);
      setUpdateStatus('downloaded');
      setUpdateInfo({ ...info, downloaded: true });
      setDownloadProgress(null);
    });

    // Escuchar errores
    const unsubscribeError = window.electronAPI.onUpdateError?.((err) => {
      console.error('❌ Error en actualización:', err);
      setUpdateStatus('error');
      setError(err.message || 'Error al buscar actualizaciones');
    });

    // Cleanup
    return () => {
      unsubscribeAvailable?.();
      unsubscribeProgress?.();
      unsubscribeDownloaded?.();
      unsubscribeError?.();
    };
  }, []);

  const handleCheckForUpdates = () => {
    if (!autoUpdaterAvailable) {
      alert('El sistema de actualizaciones no está disponible.\n\nEstás usando la versión portable. Para recibir actualizaciones automáticas, instala la aplicación usando el instalador .exe');
      return;
    }

    console.log('🔍 Verificando actualizaciones...');
    setUpdateStatus('checking');
    setError(null);
    window.electronAPI?.checkForUpdates();
  };

  const handleDownloadUpdate = () => {
    if (!autoUpdaterAvailable) return;
    console.log('⬇️ Iniciando descarga...');
    window.electronAPI?.downloadUpdate();
  };

  const handleRestartApp = () => {
    if (!autoUpdaterAvailable) return;
    console.log('🔄 Reiniciando aplicación...');
    window.electronAPI?.restartApp();
  };

  const handleDismiss = () => {
    setUpdateInfo(null);
    setDownloadProgress(null);
    setUpdateStatus('idle');
    setError(null);
  };

  // No renderizar si no hay Electron API
  if (!window.electronAPI) return null;

  // MODO PORTABLE - Mostrar advertencia
  if (!autoUpdaterAvailable && updateStatus === 'idle') {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-yellow-50 shadow-xl rounded-lg p-4 border-2 border-yellow-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <h3 className="font-semibold text-yellow-900 text-sm">
                Modo Portable
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-yellow-800 mb-3">
            Las actualizaciones automáticas no están disponibles en la versión portable. 
            Instala la aplicación para recibir actualizaciones.
          </p>
          <a
            href="https://github.com/Juand2602/Maca-app-electron/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-yellow-700 hover:text-yellow-900 font-medium"
          >
            <Download className="w-3 h-3" />
            Descargar instalador
          </a>
        </div>
      </div>
    );
  }

  // VERIFICANDO ACTUALIZACIONES
  if (updateStatus === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white shadow-xl rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Verificando actualizaciones...
              </p>
              <p className="text-xs text-gray-500">
                Esto tomará solo unos segundos
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR
  if (updateStatus === 'error' && error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-red-50 shadow-xl rounded-lg p-4 border-2 border-red-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <h3 className="font-semibold text-red-900 text-sm">
                Error al actualizar
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-red-800 mb-3">
            {error}
          </p>
          <button
            onClick={handleCheckForUpdates}
            className="text-xs text-red-700 hover:text-red-900 font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ACTUALIZACIÓN DISPONIBLE
  if (updateStatus === 'available' && updateInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white shadow-xl rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Actualización disponible
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
            La versión <span className="font-semibold">{updateInfo.version}</span> está disponible.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadUpdate}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Descargar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Más tarde
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DESCARGANDO
  if (updateStatus === 'downloading' && downloadProgress) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white shadow-xl rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600 animate-pulse" />
              <h3 className="font-semibold text-gray-900">
                Descargando actualización
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progreso</span>
              <span className="font-semibold">{Math.round(downloadProgress.percent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
            {downloadProgress.transferred && downloadProgress.total && (
              <p className="text-xs text-gray-500 mt-2">
                {(downloadProgress.transferred / 1024 / 1024).toFixed(1)} MB de{' '}
                {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB
                {downloadProgress.bytesPerSecond && (
                  <span className="ml-2">
                    ({(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s)
                  </span>
                )}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500">
            La actualización se instalará al reiniciar la aplicación
          </p>
        </div>
      </div>
    );
  }

  // ACTUALIZACIÓN DESCARGADA
  if (updateStatus === 'downloaded' && updateInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white shadow-xl rounded-lg p-4 border-2 border-green-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                Actualización lista
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            La versión <span className="font-semibold">{updateInfo.version}</span> ha sido descargada 
            y está lista para instalar.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleRestartApp}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar ahora
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Más tarde
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            La actualización se instalará automáticamente al cerrar la aplicación
          </p>
        </div>
      </div>
    );
  }

  // BOTÓN PARA VERIFICAR ACTUALIZACIONES (Estado idle)
  if (autoUpdaterAvailable && updateStatus === 'idle') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleCheckForUpdates}
          className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200"
          title="Buscar actualizaciones"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">Buscar actualizaciones</span>
        </button>
      </div>
    );
  }

  return null;
}