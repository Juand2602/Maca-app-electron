import api from './api'

export const salesService = {
  // Obtener todas las ventas
  getAllSales: async () => {
    try {
      const response = await api.get('/sales')
      return response.data
    } catch (error) {
      console.error('Error fetching sales:', error)
      throw error
    }
  },

  // Obtener ventas con paginación y filtros
  getSalesWithFilters: async (params) => {
    try {
      const response = await api.get('/sales/paginated', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching filtered sales:', error)
      throw error
    }
  },

  // Obtener ventas con paginación (método antiguo, mantener por compatibilidad)
  getSalesPaginated: async (page = 0, size = 10, sort = 'id,desc') => {
    try {
      const response = await api.get('/sales/paginated', {
        params: { page, size, sort }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching paginated sales:', error)
      throw error
    }
  },

  // Resto de métodos sin cambios...
  getSaleById: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching sale:', error)
      if (error.response?.status === 404) {
        throw new Error('Venta no encontrada')
      }
      throw error
    }
  },

  getSaleBySaleNumber: async (saleNumber) => {
    try {
      const response = await api.get(`/sales/number/${saleNumber}`)
      return response.data
    } catch (error) {
      console.error('Error fetching sale by number:', error)
      if (error.response?.status === 404) {
        throw new Error('Venta no encontrada')
      }
      throw error
    }
  },

  createSale: async (saleData) => {
    try {
      const response = await api.post('/sales', saleData)
      return response.data
    } catch (error) {
      console.error('Error creating sale:', error)
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Datos inválidos')
      }
      throw error
    }
  },

  searchSales: async (query) => {
    try {
      const response = await api.get('/sales/search', {
        params: { q: query }
      })
      return response.data
    } catch (error) {
      console.error('Error searching sales:', error)
      throw error
    }
  },

  getSalesByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/sales/by-date-range', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching sales by date range:', error)
      throw error
    }
  },

  getTotalsByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/sales/totals', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching totals by date range:', error)
      throw error
    }
  },

  cancelSale: async (id) => {
    try {
      const response = await api.patch(`/sales/${id}/cancel`)
      return response.data
    } catch (error) {
      console.error('Error cancelling sale:', error)
      if (error.response?.status === 404) {
        throw new Error('Venta no encontrada')
      }
      throw error
    }
  }
}