import { create } from 'zustand'
import { providersService } from '../services/providersService'

export const useProvidersStore = create((set, get) => ({
  // Estado
  providers: [],
  invoices: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  filters: {
    status: 'active',
    city: ''
  },
  invoiceFilters: {
    status: 'all',
    providerId: '',
    dateRange: 'all'
  },

  // Acciones CRUD para Proveedores

  // Obtener todos los proveedores
  fetchProviders: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const providers = await providersService.getAllProviders()
      set({ providers, isLoading: false })
      return providers
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Obtener proveedor por ID
  fetchProviderById: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const provider = await providersService.getProviderById(id)
      set({ isLoading: false })
      return provider
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Obtener proveedor por ID (sin llamada a API)
  getProviderById: (id) => {
    const { providers } = get()
    return providers.find(provider => provider.id === parseInt(id))
  },

  // Crear proveedor
  addProvider: async (providerData) => {
    set({ isLoading: true, error: null })
    
    try {
      const newProvider = await providersService.createProvider(providerData)
      
      set(state => ({
        providers: [...state.providers, newProvider],
        isLoading: false
      }))

      return { success: true, provider: newProvider }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Actualizar proveedor
  updateProvider: async (id, providerData) => {
    set({ isLoading: true, error: null })
    
    try {
      const updatedProvider = await providersService.updateProvider(id, providerData)

      set(state => ({
        providers: state.providers.map(p => 
          p.id === parseInt(id) ? updatedProvider : p
        ),
        isLoading: false
      }))

      return { success: true, provider: updatedProvider }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Cambiar estado del proveedor
  toggleProviderStatus: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const { providers } = get()
      const provider = providers.find(p => p.id === parseInt(id))
      
      if (!provider) {
        throw new Error('Proveedor no encontrado')
      }

      if (provider.isActive) {
        await providersService.deleteProvider(id)
      } else {
        await providersService.activateProvider(id)
      }

      set(state => ({
        providers: state.providers.map(p => 
          p.id === parseInt(id) ? { ...p, isActive: !p.isActive } : p
        ),
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Filtros y búsqueda para proveedores
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
        status: 'active',
        city: ''
      }
    })
  },

  // Obtener proveedores filtrados
  getFilteredProviders: () => {
    const { providers, searchTerm, filters } = get()
    let filtered = [...providers]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.contactName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(provider => 
        filters.status === 'active' ? provider.isActive : !provider.isActive
      )
    }

    // Filtro por ciudad
    if (filters.city) {
      filtered = filtered.filter(provider => provider.city === filters.city)
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  // Acciones para Facturas (manteniendo la lógica existente)

  // Obtener facturas
  getInvoices: () => {
    const { invoices } = get()
    return invoices
  },

  // Obtener factura por ID
  getInvoiceById: (id) => {
    const { invoices } = get()
    return invoices.find(invoice => invoice.id === parseInt(id))
  },

  // Obtener facturas por proveedor
  getInvoicesByProvider: (providerId) => {
    const { invoices } = get()
    return invoices.filter(invoice => invoice.providerId === parseInt(providerId))
  },

  // Crear factura
  addInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null })
    
    try {
      const { providers } = get()
      const provider = providers.find(p => p.id === invoiceData.providerId)
      if (!provider) {
        throw new Error('Proveedor no encontrado')
      }

      const totalCost = invoiceData.items.reduce((sum, item) => sum + item.total, 0)
      
      const newInvoice = {
        ...invoiceData,
        id: Math.max(...get().invoices.map(i => i.id), 0) + 1,
        providerName: provider.name,
        totalCost,
        paidAmount: 0,
        balance: totalCost,
        status: 'pending',
        payments: [],
        createdAt: new Date().toISOString()
      }

      set(state => ({
        invoices: [...state.invoices, newInvoice],
        isLoading: false
      }))

      return { success: true, invoice: newInvoice }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Agregar pago a factura
  addPaymentToInvoice: async (invoiceId, paymentData) => {
    set({ isLoading: true, error: null })
    
    try {
      const { invoices } = get()
      const invoiceIndex = invoices.findIndex(i => i.id === parseInt(invoiceId))
      
      if (invoiceIndex === -1) {
        throw new Error('Factura no encontrada')
      }

      const invoice = invoices[invoiceIndex]
      const newPaymentId = Math.max(...invoice.payments.map(p => p.id), 0) + 1
      
      const newPayment = {
        ...paymentData,
        id: newPaymentId,
        date: paymentData.date || new Date().toISOString()
      }

      const newPaidAmount = invoice.paidAmount + parseFloat(paymentData.amount)
      const newBalance = invoice.totalCost - newPaidAmount
      const newStatus = newBalance <= 0 ? 'paid' : 'pending'

      const updatedInvoice = {
        ...invoice,
        payments: [...invoice.payments, newPayment],
        paidAmount: newPaidAmount,
        balance: Math.max(0, newBalance),
        status: newStatus
      }

      set(state => ({
        invoices: state.invoices.map(i => 
          i.id === parseInt(invoiceId) ? updatedInvoice : i
        ),
        isLoading: false
      }))

      return { success: true, payment: newPayment, invoice: updatedInvoice }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Filtros para facturas
  setInvoiceFilters: (newFilters) => {
    set(state => ({ 
      invoiceFilters: { ...state.invoiceFilters, ...newFilters }
    }))
  },

  clearInvoiceFilters: () => {
    set({ 
      invoiceFilters: {
        status: 'all',
        providerId: '',
        dateRange: 'all'
      }
    })
  },

  // Obtener facturas filtradas
  getFilteredInvoices: () => {
    const { invoices, invoiceFilters } = get()
    let filtered = [...invoices]

    // Filtro por estado
    if (invoiceFilters.status && invoiceFilters.status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === invoiceFilters.status)
    }

    // Filtro por proveedor
    if (invoiceFilters.providerId) {
      filtered = filtered.filter(invoice => 
        invoice.providerId === parseInt(invoiceFilters.providerId)
      )
    }

    // Filtro por rango de fechas
    if (invoiceFilters.dateRange && invoiceFilters.dateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date)
        
        switch (invoiceFilters.dateRange) {
          case 'month':
            const monthAgo = new Date(today)
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return invoiceDate >= monthAgo
          case 'quarter':
            const quarterAgo = new Date(today)
            quarterAgo.setMonth(quarterAgo.getMonth() - 3)
            return invoiceDate >= quarterAgo
          case 'year':
            const yearAgo = new Date(today)
            yearAgo.setFullYear(yearAgo.getFullYear() - 1)
            return invoiceDate >= yearAgo
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  },

  // Estadísticas
  getProvidersStats: () => {
    const { providers, invoices } = get()

    const stats = {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.isActive).length,
      inactiveProviders: providers.filter(p => !p.isActive).length,
      totalInvoices: invoices.length,
      pendingInvoices: invoices.filter(i => i.status === 'pending').length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      totalDebt: invoices.reduce((sum, i) => sum + i.balance, 0),
      totalPaid: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
      totalInvoiceAmount: invoices.reduce((sum, i) => sum + i.totalCost, 0),
      
      // Top proveedores por monto
      topProviders: (() => {
        const providerStats = {}
        invoices.forEach(invoice => {
          if (!providerStats[invoice.providerId]) {
            const provider = providers.find(p => p.id === invoice.providerId)
            providerStats[invoice.providerId] = {
              id: invoice.providerId,
              name: provider?.name || 'Desconocido',
              totalAmount: 0,
              totalPaid: 0,
              balance: 0,
              invoiceCount: 0
            }
          }
          providerStats[invoice.providerId].totalAmount += invoice.totalCost
          providerStats[invoice.providerId].totalPaid += invoice.paidAmount
          providerStats[invoice.providerId].balance += invoice.balance
          providerStats[invoice.providerId].invoiceCount += 1
        })
        
        return Object.values(providerStats)
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5)
      })()
    }

    return stats
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null })
  }
}))