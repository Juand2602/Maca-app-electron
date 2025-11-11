import { useEffect, useState } from "react";

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isElectron, setIsElectron] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Verificar si estamos en Electron
    if (typeof window !== "undefined" && window.electronAPI) {
      setIsElectron(true);

      // Escuchar eventos de actualización (UN SOLO LISTENER)
      const unsubscribe = window.electronAPI.onUpdateStatus((data) => {
        console.log("📦 Update status:", data);
        setUpdateInfo(data);
        setShowNotification(true);

        // Auto-ocultar notificación de "actualizado" después de 5 segundos
        if (data.status === "not-available") {
          setTimeout(() => {
            setShowNotification(false);
          }, 5000);
        }
      });

      // Limpiar al desmontar
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  if (!isElectron || !updateInfo || !showNotification) return null;

  const handleDownload = () => {
    window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI.installUpdate();
  };

  const handleCheckUpdates = () => {
    window.electronAPI.checkForUpdates();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Verificando actualizaciones */}
      {updateInfo.status === "checking" && (
        <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <span className="text-sm font-medium">{updateInfo.message}</span>
        </div>
      )}

      {/* Actualización disponible */}
      {updateInfo.status === "available" && (
        <div className="bg-white border-2 border-green-500 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-green-500 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="font-bold text-white text-sm">
                ¡Actualización disponible!
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-green-600 rounded p-1 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-700 text-sm mb-3">
              Versión{" "}
              <span className="font-semibold">{updateInfo.version}</span> está
              lista para descargar
            </p>
            <button
              onClick={handleDownload}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Descargar ahora
            </button>
          </div>
        </div>
      )}

      {/* Descargando */}
      {updateInfo.status === "downloading" && (
        <div className="bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-pulse">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-sm">
                Descargando actualización
              </h3>
              <p className="text-xs text-gray-600">
                Esto puede tardar unos minutos...
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${updateInfo.percent || 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-600 font-medium">
              {Math.round(updateInfo.percent || 0)}%
            </p>
            {updateInfo.transferred && updateInfo.total && (
              <p className="text-xs text-gray-500">
                {(updateInfo.transferred / 1024 / 1024).toFixed(1)} MB de{" "}
                {(updateInfo.total / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
          {updateInfo.bytesPerSecond && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              {(updateInfo.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
            </p>
          )}
        </div>
      )}

      {/* Descarga completada */}
      {updateInfo.status === "downloaded" && (
        <div className="bg-white border-2 border-purple-500 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-purple-500 px-4 py-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              ¡Actualización lista!
            </h3>
          </div>
          <div className="p-4">
            <p className="text-gray-700 text-sm mb-3">
              La aplicación se reiniciará para instalar la versión{" "}
              {updateInfo.version}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Instalar ahora
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition"
              >
                Más tarde
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Se instalará automáticamente al cerrar la app
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {updateInfo.status === "error" && (
        <div className="bg-white border-2 border-red-500 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-red-500 px-4 py-2 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Error
            </h3>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-red-600 rounded p-1 transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-700 text-sm mb-3">{updateInfo.message}</p>
            <button
              onClick={handleCheckUpdates}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* App actualizada */}
      {updateInfo.status === "not-available" && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <svg
            className="w-5 h-5 text-green-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-gray-700">{updateInfo.message}</span>
          <button
            onClick={handleDismiss}
            className="ml-auto text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}