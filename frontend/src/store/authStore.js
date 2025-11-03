import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authService.login(credentials)
          const { user, token } = response
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          
          authService.setAuthToken(token)
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.message || 'Error al iniciar sesión'
          set({
            user: null,
            token: null,
            isAuthenticated: false, 
            isLoading: false,
            error: errorMessage,
          })
          
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          console.error('Error al cerrar sesión:', error)
        } finally {
          authService.clearAuthToken()
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
        }
      },

      initialize: async () => {
        try {
          const tokenData = localStorage.getItem('tokenData')
          const userData = localStorage.getItem('user')
          
          if (tokenData && userData) {
            try {
              const { token, expiresAt } = JSON.parse(tokenData)
              
              // Verificar si el token ha expirado
              if (new Date().getTime() >= expiresAt) {
                await get().logout()
                return
              }
              
              // Verificar token con el servidor
              await authService.verifyToken()
              
              set({
                user: JSON.parse(userData),
                token: token,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              
              authService.setAuthToken(token)
            } catch (error) {
              console.error('Error al verificar token:', error)
              await get().logout()
            }
          } else {
            set({
              isLoading: false,
            })
          }
        } catch (error) {
          console.error('Error al inicializar autenticación:', error)
          set({
            isLoading: false,
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      // Getters
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'ADMIN'
      },

      getWarehouse: () => {
        const { user } = get()
        return user?.warehouse || 'San Francisco'
      },
    }),
    {
      name: 'auth-storage', // nombre de la clave en el localStorage
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

// Exportar funciones de utilidad para usar fuera del store
export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user?.role === 'ADMIN'
}

export const getWarehouse = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user?.warehouse || 'San Francisco'
}