import axios from 'axios'
import toast from 'react-hot-toast'

// Variable global para controlar si ya se está procesando un logout
let isLoggingOut = false

// ============= DETECTAR ENTORNO Y OBTENER BASE URL =============

const isElectron = () => {
  return (
    typeof window !== 'undefined' &&
    typeof window.electronAPI !== 'undefined' &&
    window.electronAPI.isElectron === true
  );
};

const getBaseURL = async () => {
  if (isElectron()) {
    try {
      // En Electron, obtener la URL del backend desde el proceso principal
      const backendUrl = await window.electronAPI.getBackendUrl();
      console.log('✅ Running in Electron - Backend URL:', backendUrl);
      return `${backendUrl}/api`;
    } catch (error) {
      console.error('❌ Error getting backend URL from Electron:', error);
      return 'http://localhost:3000/api';
    }
  } else {
    // En navegador web (desarrollo)
    const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    console.log('🌐 Running in browser - API URL:', url);
    return url;
  }
};

// ============= INICIALIZAR API =============

// Crear instancia temporal de axios (se actualizará después)
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // URL temporal
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inicializar la baseURL correcta de forma asíncrona
const initializeAPI = async () => {
  const baseURL = await getBaseURL();
  api.defaults.baseURL = baseURL;
  console.log('🔗 API initialized with baseURL:', baseURL);
  return api;
};

// Inicializar inmediatamente
let apiInitPromise = initializeAPI();

// ============= FUNCIÓN PARA LIMPIAR Y REDIRIGIR =============

const clearAuthAndRedirect = () => {
  if (isLoggingOut) return
  isLoggingOut = true
  
  // Limpiar todos los datos de autenticación
  localStorage.removeItem('tokenData')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('auth-storage')
  sessionStorage.removeItem('logoutMessageShown')
  
  // Redirigir solo si no estamos ya en login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
  
  // Resetear flag después de un tiempo
  setTimeout(() => {
    isLoggingOut = false
  }, 1000)
}

// ============= INTERCEPTOR PARA REQUESTS =============

api.interceptors.request.use(
  async (config) => {
    // Esperar a que la API esté inicializada
    await apiInitPromise;
    
    // Agregar timestamp para evitar cache
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
    
    // Obtener token del localStorage (mantener compatibilidad con tokenData)
    const tokenData = localStorage.getItem('tokenData')
    const token = localStorage.getItem('token')
    
    if (tokenData) {
      try {
        const { token: parsedToken, expiresAt } = JSON.parse(tokenData)
        // Verificar si el token ha expirado ANTES de hacer la petición
        if (new Date().getTime() < expiresAt) {
          config.headers.Authorization = `Bearer ${parsedToken}`
        } else {
          // Token expirado, limpiar y redirigir
          clearAuthAndRedirect()
          // Cancelar la petición para evitar errores adicionales
          return Promise.reject(new Error('Token expirado'))
        }
      } catch (e) {
        console.error('Error al parsear tokenData:', e)
        clearAuthAndRedirect()
        return Promise.reject(new Error('Error en token'))
      }
    } else if (token) {
      // Usar el nuevo formato de token simple
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============= INTERCEPTOR PARA RESPONSES =============

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const { response, request, message } = error

    if (response) {
      // El servidor respondió con un código de error
      const { status, data } = response
      
      if (status === 401) {
        // Token expirado o inválido
        if (!sessionStorage.getItem('logoutMessageShown')) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente')
          sessionStorage.setItem('logoutMessageShown', 'true')
        }
        
        clearAuthAndRedirect()
        return Promise.reject(error)
      }
      
      switch (status) {
        case 400:
          toast.error(data.message || data.error || 'Solicitud inválida')
          break
        case 403:
          toast.error('No tiene permisos para realizar esta acción')
          break
        case 404:
          toast.error(data.message || 'Recurso no encontrado')
          break
        case 409:
          toast.error(data.message || 'Conflicto en los datos')
          break
        case 422:
          // Errores de validación
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err))
          } else {
            toast.error(data.message || 'Error de validación')
          }
          break
        case 500:
          toast.error('Error interno del servidor. Intente nuevamente')
          break
        default:
          toast.error(data.message || data.error || 'Error desconocido')
      }
    } else if (request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('Connection error:', message);
      toast.error('Error de conexión. Verifique su conexión a internet')
      
      // Manejo de errores de conexión específico para Electron
      if (isElectron() && window.electronAPI?.checkBackendStatus) {
        try {
          const isHealthy = await window.electronAPI.checkBackendStatus();
          if (!isHealthy) {
            console.error('El backend no está disponible');
            toast.error('El backend no está disponible. Intente reiniciar la aplicación.');
          }
        } catch (checkError) {
          console.error('Error checking backend status:', checkError);
        }
      }
    } else {
      // Error al configurar la petición
      console.error('Request configuration error:', message);
      toast.error('Error de configuración: ' + message)
    }

    return Promise.reject(error)
  }
)

// ============= FUNCIONES DE VERIFICACIÓN =============

export const checkBackendConnection = async () => {
  try {
    await apiInitPromise; // Esperar inicialización
    const baseURL = api.defaults.baseURL.replace('/api', '');
    const response = await axios.get(`${baseURL}/health`, {
      timeout: 5000,
    });
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};

// ============= EXPORT =============

export default api;
export { isElectron, initializeAPI };