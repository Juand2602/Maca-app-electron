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
      const backendUrl = await window.electronAPI.getBackendUrl();
      console.log('✅ Running in Electron - Backend URL:', backendUrl);
      return `${backendUrl}/api`;
    } catch (error) {
      console.error('❌ Error getting backend URL from Electron:', error);
      return 'http://localhost:3000/api';
    }
  } else {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    console.log('🌐 Running in browser - API URL:', url);
    return url;
  }
};

// ============= INICIALIZAR API =============

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Estado de inicialización
let isInitialized = false;
let initializationPromise = null;

// Inicializar la baseURL correcta de forma asíncrona
const initializeAPI = async () => {
  if (isInitialized) return api;
  
  if (initializationPromise) {
    await initializationPromise;
    return api;
  }

  initializationPromise = (async () => {
    try {
      const baseURL = await getBaseURL();
      api.defaults.baseURL = baseURL;
      isInitialized = true;
      console.log('🔗 API initialized with baseURL:', baseURL);
    } catch (error) {
      console.error('❌ Failed to initialize API:', error);
      // Usar URL por defecto en caso de error
      api.defaults.baseURL = 'http://localhost:3000/api';
      isInitialized = true;
    }
  })();

  await initializationPromise;
  return api;
};

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
    // MODIFICADO: Esperar a que la API esté inicializada
    if (!isInitialized) {
      await initializeAPI();
    }
    
    // Agregar timestamp para evitar cache
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
    
    // Obtener token del localStorage
    const tokenData = localStorage.getItem('tokenData')
    const token = localStorage.getItem('token')
    
    if (tokenData) {
      try {
        const { token: parsedToken, expiresAt } = JSON.parse(tokenData)
        // Verificar si el token ha expirado ANTES de hacer la petición
        if (new Date().getTime() < expiresAt) {
          config.headers.Authorization = `Bearer ${parsedToken}`
        } else {
          console.warn('⚠️ Token expired before request')
          clearAuthAndRedirect()
          return Promise.reject(new Error('Token expirado'))
        }
      } catch (e) {
        console.error('❌ Error parsing tokenData:', e)
        clearAuthAndRedirect()
        return Promise.reject(new Error('Error en token'))
      }
    } else if (token) {
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
      const { status, data } = response
      
      if (status === 401) {
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
      console.error('❌ Connection error:', message);
      
      // MODIFICADO: No mostrar error si estamos en inicialización
      if (isInitialized) {
        toast.error('Error de conexión con el servidor')
      }
      
      // Verificar estado del backend en Electron
      if (isElectron() && window.electronAPI?.checkBackendStatus) {
        try {
          const isHealthy = await window.electronAPI.checkBackendStatus();
          if (!isHealthy) {
            console.error('❌ Backend not available');
            if (isInitialized) {
              toast.error('El backend no está disponible');
            }
          }
        } catch (checkError) {
          console.error('❌ Error checking backend status:', checkError);
        }
      }
    } else {
      console.error('❌ Request configuration error:', message);
      if (isInitialized) {
        toast.error('Error de configuración: ' + message)
      }
    }

    return Promise.reject(error)
  }
)

// ============= FUNCIONES DE VERIFICACIÓN =============

export const checkBackendConnection = async () => {
  try {
    // Asegurar que la API esté inicializada
    if (!isInitialized) {
      await initializeAPI();
    }
    
    const baseURL = api.defaults.baseURL.replace('/api', '');
    const response = await axios.get(`${baseURL}/health`, {
      timeout: 5000,
    });
    
    console.log('✅ Backend connection check:', response.data);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

// ============= EXPORT =============

export default api;
export { isElectron, initializeAPI };