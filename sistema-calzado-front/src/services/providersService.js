import api from './api'

export const providersService = {
  // Obtener todos los proveedores
  getAllProviders: async () => {
    try {
      const response = await api.get('/providers')
      return response.data
    } catch (error) {
      console.error('Error fetching providers:', error)
      throw error
    }
  },

  // Obtener proveedor por ID
  getProviderById: async (id) => {
    try {
      const response = await api.get(`/providers/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching provider:', error)
      throw error
    }
  },

  // Crear proveedor
  createProvider: async (providerData) => {
    try {
      const response = await api.post('/providers', providerData)
      return response.data
    } catch (error) {
      console.error('Error creating provider:', error)
      throw error
    }
  },

  // Actualizar proveedor
  updateProvider: async (id, providerData) => {
    try {
      const response = await api.put(`/providers/${id}`, providerData)
      return response.data
    } catch (error) {
      console.error('Error updating provider:', error)
      throw error
    }
  },

  // Eliminar (desactivar) proveedor
  deleteProvider: async (id) => {
    try {
      const response = await api.delete(`/providers/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting provider:', error)
      throw error
    }
  },

  // Activar proveedor
  activateProvider: async (id) => {
    try {
      const response = await api.patch(`/providers/${id}/activate`)
      return response.data
    } catch (error) {
      console.error('Error activating provider:', error)
      throw error
    }
  },

  // Buscar proveedores
  searchProviders: async (query) => {
    try {
      const response = await api.get(`/providers/search?q=${query}`)
      return response.data
    } catch (error) {
      console.error('Error searching providers:', error)
      throw error
    }
  },

  // Obtener proveedores activos
  getActiveProviders: async () => {
    try {
      const response = await api.get('/providers/active')
      return response.data
    } catch (error) {
      console.error('Error fetching active providers:', error)
      throw error
    }
  },

  // Obtener ciudades
  getCities: async () => {
    try {
      const response = await api.get('/providers/cities')
      return response.data
    } catch (error) {
      console.error('Error fetching cities:', error)
      throw error
    }
  },

  // Obtener países
  getCountries: async () => {
    try {
      const response = await api.get('/providers/countries')
      return response.data
    } catch (error) {
      console.error('Error fetching countries:', error)
      throw error
    }
  }
}