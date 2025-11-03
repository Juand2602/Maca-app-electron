import axios from 'axios'
import toast from 'react-hot-toast'

// Variable global para controlar si ya se está procesando un logout
let isLoggingOut = false

// Obtener la URL base del backend de forma SÍNCRONA
const getBaseURLSync = () => {
  // En Electron, usar localhost:3000
  // En web, usar variable de entorno o localhost:3000
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

// Crear instancia de axios CON baseURL desde el inicio
const api = axios.create({
  baseURL: getBaseURLSync(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔗 API initialized with baseURL:', api.defaults.baseURL);

// Función para limpiar y redirigir
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
}

// Interceptor para requests
api.interceptors.request.use(
  async (config) => {
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

// Interceptor para responses
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
      if (window.electronAPI?.checkBackendStatus) {
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

export default api