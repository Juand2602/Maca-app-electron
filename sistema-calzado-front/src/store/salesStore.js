import { create } from 'zustand'
import { salesService } from '../services/salesService'

export const useSalesStore = create((set, get) => ({
  // Estado
  sales: [],
  currentSale: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  filters: {
    dateRange: 'today',
    employee: '',
    paymentMethod: '',
    status: 'COMPLETED'
  },
  stats: {
    todayStats: { count: 0, total: 0, items: 0 },
    weekStats: { count: 0, total: 0, items: 0 },
    monthStats: { count: 0, total: 0, items: 0 },
    paymentMethods: {},
    topProducts: []
  },

  // Obtener todas las ventas
  fetchSales: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const sales = await salesService.getAllSales()
      set({ sales, isLoading: false })
      return sales
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Obtener venta por ID
  fetchSaleById: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const sale = await salesService.getSaleById(id)
      set({ currentSale: sale, isLoading: false })
      return { success: true, sale }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Obtener venta por ID (sin loading)
  getSaleById: (id) => {
    const { sales } = get()
    return sales.find(sale => sale.id === parseInt(id))
  },

  // Crear nueva venta
  createSale: async (saleData) => {
    set({ isLoading: true, error: null })
    
    try {
      const newSale = await salesService.createSale(saleData)
      
      // Actualizar el estado con la nueva venta
      set(state => ({
        sales: [newSale, ...state.sales],
        currentSale: null,
        isLoading: false
      }))

      return { success: true, sale: newSale }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Eliminar venta (solo admin)
  deleteSale: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      await salesService.cancelSale(id)
      
      set(state => ({
        sales: state.sales.filter(s => s.id !== parseInt(id)),
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Gestión de venta actual (en proceso)
  setCurrentSale: (saleData) => {
    set({ currentSale: saleData })
  },

  clearCurrentSale: () => {
    set({ currentSale: null })
  },

  // Filtros y búsqueda
  setSearchTerm: (term) => {
    set({ searchTerm: term })
  },

  setFilters: (newFilters) => {
    set(state => ({ 
      filters: { ...state.filters, ...newFilters }
    }))
  },

  clearFilters: () => {
    set({ 
      searchTerm: '',
      filters: {
        dateRange: 'today',
        employee: '',
        paymentMethod: '',
        status: 'COMPLETED'
      }
    })
  },

  // Obtener ventas filtradas
  getFilteredSales: () => {
    const { sales, searchTerm, filters } = get()
    let filtered = [...sales]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerPhone?.includes(searchTerm) ||
        sale.items.some(item => 
          item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        sale.id.toString().includes(searchTerm)
      )
    }

    // Filtro por método de pago
    if (filters.paymentMethod) {
      filtered = filtered.filter(sale => sale.paymentMethod === filters.paymentMethod)
    }

    // Filtro por estado
    if (filters.status) {
      filtered = filtered.filter(sale => sale.status === filters.status)
    }

    // Filtro por rango de fechas
    if (filters.dateRange) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        
        switch (filters.dateRange) {
          case 'today':
            return saleDate >= today
          case 'yesterday':
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            return saleDate >= yesterday && saleDate < today
          case 'week':
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return saleDate >= weekAgo
          case 'month':
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return saleDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  // Estadísticas de ventas
  getSalesStats: () => {
    const { sales } = get()
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    // Ventas de hoy
    const todaySales = sales.filter(sale => new Date(sale.createdAt) >= startOfToday)
    
    // Ventas de esta semana
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const weekSales = sales.filter(sale => new Date(sale.createdAt) >= startOfWeek)
    
    // Ventas de este mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthSales = sales.filter(sale => new Date(sale.createdAt) >= startOfMonth)

    const stats = {
      // Hoy
      todayStats: {
        count: todaySales.length,
        total: todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        items: todaySales.reduce((sum, sale) => sum + (sale.totalItems || 0), 0)
      },
      
      // Esta semana
      weekStats: {
        count: weekSales.length,
        total: weekSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        items: weekSales.reduce((sum, sale) => sum + (sale.totalItems || 0), 0)
      },
      
      // Este mes
      monthStats: {
        count: monthSales.length,
        total: monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        items: monthSales.reduce((sum, sale) => sum + (sale.totalItems || 0), 0)
      },

      // Métodos de pago más usados
      paymentMethods: {
        'CASH': sales.reduce((count, sale) => 
          count + (sale.paymentMethod === 'CASH' ? 1 : 0), 0),
        'CARD': sales.reduce((count, sale) => 
          count + (sale.paymentMethod === 'CARD' ? 1 : 0), 0),
        'TRANSFER': sales.reduce((count, sale) => 
          count + (sale.paymentMethod === 'TRANSFER' ? 1 : 0), 0),
        'MIXED': sales.reduce((count, sale) => 
          count + (sale.paymentMethod === 'MIXED' ? 1 : 0), 0)
      },

      // Productos más vendidos
      topProducts: (() => {
        const productStats = {}
        sales.forEach(sale => {
          sale.items.forEach(item => {
            if (!productStats[item.productCode]) {
              productStats[item.productCode] = {
                reference: item.productCode,
                name: item.productName,
                quantity: 0,
                total: 0
              }
            }
            productStats[item.productCode].quantity += item.quantity
            productStats[item.productCode].total += item.subtotal
          })
        })
        
        return Object.values(productStats)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
      })()
    }

    return stats
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null })
  },

  // Resetear datos (para testing)
  resetSalesData: () => {
    set({
      sales: [],
      currentSale: null,
      searchTerm: '',
      filters: {
        dateRange: 'today',
        employee: '',
        paymentMethod: '',
        status: 'COMPLETED'
      },
      isLoading: false,
      error: null
    })
  }
}))