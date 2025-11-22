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

  // Eliminar venta (solo admin) - CORREGIDO
  deleteSale: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      await salesService.cancelSale(id)
      
      // CORREGIDO: Recargar todas las ventas desde el servidor
      const updatedSales = await salesService.getAllSales()
      
      set({
        sales: updatedSales,
        isLoading: false
      })

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

    // Filtro por método de pago - CORREGIDO para soportar pagos mixtos
    if (filters.paymentMethod) {
      filtered = filtered.filter(sale => {
        // Si es pago mixto
        if (sale.isMixedPayment) {
          return filters.paymentMethod === 'MIXED'
        }
        // Si tiene payments array
        if (sale.payments && sale.payments.length > 0) {
          return sale.payments[0].paymentMethod === filters.paymentMethod
        }
        // Legacy: usar paymentMethod directo
        return sale.paymentMethod === filters.paymentMethod
      })
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

  // Estadísticas de ventas - CORREGIDO
  getSalesStats: () => {
    const { sales } = get()
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    // Filtrar solo ventas completadas para estadísticas
    const completedSales = sales.filter(sale => sale.status === 'COMPLETED')
    
    // Ventas de hoy
    const todaySales = completedSales.filter(sale => new Date(sale.createdAt) >= startOfToday)
    
    // Ventas de esta semana
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const weekSales = completedSales.filter(sale => new Date(sale.createdAt) >= startOfWeek)
    
    // Ventas de este mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthSales = completedSales.filter(sale => new Date(sale.createdAt) >= startOfMonth)

    const stats = {
      // Hoy
      todayStats: {
        count: todaySales.length,
        total: todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        items: todaySales.reduce((sum, sale) => {
          // Calcular items correctamente
          const saleItems = sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0
          return sum + saleItems
        }, 0)
      },
      
      // Esta semana
      weekStats: {
        count: weekSales.length,
        total: weekSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        items: weekSales.reduce((sum, sale) => {
          const saleItems = sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0
          return sum + saleItems
        }, 0)
      },
      
      // Este mes
      monthStats: {
        count: monthSales.length,
        total: monthSales.reduce((sum, sale) => sum + (sale.total || 0), 0),
        items: monthSales.reduce((sum, sale) => {
          const saleItems = sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0
          return sum + saleItems
        }, 0)
      },

      // Métodos de pago más usados - CORREGIDO
      paymentMethods: (() => {
        const methods = {}
        completedSales.forEach(sale => {
          if (sale.payments && sale.payments.length > 0) {
            // Usar datos de sale_payments
            sale.payments.forEach(payment => {
              const method = payment.paymentMethod
              methods[method] = (methods[method] || 0) + 1
            })
          } else if (sale.paymentMethod) {
            // Datos legacy
            const method = sale.paymentMethod
            methods[method] = (methods[method] || 0) + 1
          }
        })
        return methods
      })(),

      // Productos más vendidos - CORREGIDO
      topProducts: (() => {
        const productStats = {}
        completedSales.forEach(sale => {
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              const key = item.productCode || item.productId
              if (!productStats[key]) {
                productStats[key] = {
                  reference: item.productCode || '',
                  name: item.productName || 'Sin nombre',
                  quantity: 0,
                  total: 0
                }
              }
              productStats[key].quantity += item.quantity || 0
              productStats[key].total += item.subtotal || 0
            })
          }
        })
        
        return Object.values(productStats)
          .filter(p => p.quantity > 0)
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