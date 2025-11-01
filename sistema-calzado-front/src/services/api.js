import axios from 'axios'
import toast from 'react-hot-toast'

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Variable global para controlar si ya se está procesando un logout
let isLoggingOut = false

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Función para limpiar y redirigir
const clearAuthAndRedirect = () => {
  if (isLoggingOut) return
  isLoggingOut = true
  
  // Limpiar todos los datos de autenticación
  localStorage.removeItem('tokenData')
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
  (config) => {
    // Agregar timestamp para evitar cache
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
    
    // Obtener token del localStorage
    const tokenData = localStorage.getItem('tokenData')
    if (tokenData) {
      try {
        const { token, expiresAt } = JSON.parse(tokenData)
        // Verificar si el token ha expirado ANTES de hacer la petición
        if (new Date().getTime() < expiresAt) {
          config.headers.Authorization = `Bearer ${token}`
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
  (error) => {
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
          toast.error('Recurso no encontrado')
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
      toast.error('Error de conexión. Verifique su conexión a internet')
    } else {
      // Error al configurar la petición
      toast.error('Error de configuración: ' + message)
    }

    return Promise.reject(error)
  }
)

export default api