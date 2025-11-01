import { create } from 'zustand'
import { accountingService } from '../services/accountingService'

export const useAccountingStore = create((set, get) => ({
  // Estado
  invoices: [],
  payments: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  filters: {
    dateRange: 'month', // today, week, month, year, custom
    status: '', // pending, partial, paid, overdue
    provider: '',
    paymentMethod: ''
  },

  // Acciones para Facturas

  // Obtener todas las facturas
  getInvoices: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const invoices = await accountingService.getInvoices()
      set({ invoices, isLoading: false })
      return invoices
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Obtener factura por ID
  getInvoiceById: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const invoice = await accountingService.getInvoiceById(id)
      set({ isLoading: false })
      return invoice
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Crear factura
  createInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await accountingService.createInvoice(invoiceData)
      
      if (response.success) {
        // Actualizar lista de facturas
        const { invoices } = get()
        set({ 
          invoices: [...invoices, response.invoice], 
          isLoading: false 
        })
        return { success: true, invoice: response.invoice }
      } else {
        throw new Error(response.error || 'Error al crear factura')
      }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Actualizar factura
  updateInvoice: async (id, invoiceData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await accountingService.updateInvoice(id, invoiceData)
      
      if (response.success) {
        // Actualizar factura en la lista
        const { invoices } = get()
        set({ 
          invoices: invoices.map(i => i.id === parseInt(id) ? response.invoice : i),
          isLoading: false 
        })
        return { success: true, invoice: response.invoice }
      } else {
        throw new Error(response.error || 'Error al actualizar factura')
      }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Eliminar factura
  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await accountingService.deleteInvoice(id)
      
      if (response.success) {
        // Eliminar factura de la lista
        const { invoices } = get()
        set({ 
          invoices: invoices.filter(i => i.id !== parseInt(id)),
          isLoading: false 
        })
        return { success: true }
      } else {
        throw new Error(response.error || 'Error al eliminar factura')
      }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Acciones para Pagos

  // Obtener todos los pagos
  getPayments: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const payments = await accountingService.getPayments()
      set({ payments, isLoading: false })
      return payments
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Crear pago
  createPayment: async (paymentData) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await accountingService.createPayment(paymentData)
      
      if (response.success) {
        // Actualizar lista de pagos
        const { payments } = get()
        set({ 
          payments: [...payments, response.payment],
          isLoading: false 
        })
        
        // Actualizar factura relacionada
        const { invoices } = get()
        const updatedInvoices = invoices.map(invoice => {
          if (invoice.id === paymentData.invoiceId) {
            return {
              ...invoice,
              paidAmount: invoice.paidAmount + paymentData.amount,
              balance: invoice.total - (invoice.paidAmount + paymentData.amount),
              status: invoice.total - (invoice.paidAmount + paymentData.amount) === 0 
                ? 'PAID' 
                : 'PARTIAL'
            }
          }
          return invoice
        })
        
        set({ invoices: updatedInvoices })
        return { success: true, payment: response.payment }
      } else {
        throw new Error(response.error || 'Error al crear pago')
      }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Eliminar pago
  deletePayment: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await accountingService.deletePayment(id)
      
      if (response.success) {
        // Eliminar pago de la lista
        const { payments } = get()
        const paymentToDelete = payments.find(p => p.id === parseInt(id))
        
        set({ 
          payments: payments.filter(p => p.id !== parseInt(id)),
          isLoading: false 
        })
        
        // Actualizar factura relacionada
        if (paymentToDelete) {
          const { invoices } = get()
          const updatedInvoices = invoices.map(invoice => {
            if (invoice.id === paymentToDelete.invoiceId) {
              return {
                ...invoice,
                paidAmount: invoice.paidAmount - paymentToDelete.amount,
                balance: invoice.total - (invoice.paidAmount - paymentToDelete.amount),
                status: invoice.total - (invoice.paidAmount - paymentToDelete.amount) === 0 
                  ? 'PAID' 
                  : invoice.paidAmount - paymentToDelete.amount > 0 
                    ? 'PARTIAL' 
                    : 'PENDING'
              }
            }
            return invoice
          })
          
          set({ invoices: updatedInvoices })
        }
        
        return { success: true }
      } else {
        throw new Error(response.error || 'Error al eliminar pago')
      }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
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
        dateRange: 'month',
        status: '',
        provider: '',
        paymentMethod: ''
      }
    })
  },

  // Obtener facturas filtradas
  getFilteredInvoices: () => {
    const { invoices, searchTerm, filters } = get()
    let filtered = [...invoices]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filtros adicionales
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status)
    }

    if (filters.provider) {
      filtered = filtered.filter(invoice => invoice.providerName === filters.provider)
    }

    // Filtro por fecha
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      const startDate = new Date()

      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          break
      }

      filtered = filtered.filter(invoice => 
        new Date(invoice.issueDate) >= startDate
      )
    }

    return filtered
  },

  // Obtener pagos filtrados
  getFilteredPayments: () => {
    const { payments, searchTerm, filters } = get()
    let filtered = [...payments]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.referenceNumber && payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filtros adicionales
    if (filters.paymentMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filters.paymentMethod)
    }

    if (filters.provider) {
      filtered = filtered.filter(payment => payment.providerName === filters.provider)
    }

    return filtered
  },

  // Estadísticas y reportes
  getAccountingStats: () => {
    const { invoices, payments } = get()
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Facturas del mes
    const monthlyInvoices = invoices.filter(i => new Date(i.issueDate) >= startOfMonth)
    const yearlyInvoices = invoices.filter(i => new Date(i.issueDate) >= startOfYear)

    // Pagos del mes
    const monthlyPayments = payments.filter(p => new Date(p.paymentDate) >= startOfMonth)
    const yearlyPayments = payments.filter(p => new Date(p.paymentDate) >= startOfYear)

    return {
      totalInvoices: invoices.length,
      totalInvoicesAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      
      pendingInvoices: invoices.filter(i => i.status === 'PENDING').length,
      pendingAmount: invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.balance, 0),
      
      paidInvoices: invoices.filter(i => i.status === 'PAID').length,
      paidAmount: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.total, 0),
      
      partialInvoices: invoices.filter(i => i.status === 'PARTIAL').length,
      partialAmount: invoices.filter(i => i.status === 'PARTIAL').reduce((sum, i) => sum + i.balance, 0),

      overdueInvoices: invoices.filter(i => {
        const dueDate = new Date(i.dueDate)
        return dueDate < now && i.status !== 'PAID'
      }).length,

      monthlyStats: {
        invoicesCount: monthlyInvoices.length,
        invoicesAmount: monthlyInvoices.reduce((sum, i) => sum + i.total, 0),
        paymentsCount: monthlyPayments.length,
        paymentsAmount: monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
      },

      yearlyStats: {
        invoicesCount: yearlyInvoices.length,
        invoicesAmount: yearlyInvoices.reduce((sum, i) => sum + i.total, 0),
        paymentsCount: yearlyPayments.length,
        paymentsAmount: yearlyPayments.reduce((sum, p) => sum + p.amount, 0)
      },

      paymentMethods: payments.reduce((acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1
        return acc
      }, {}),

      topProviders: Object.entries(
        invoices.reduce((acc, invoice) => {
          acc[invoice.providerName] = (acc[invoice.providerName] || 0) + invoice.total
          return acc
        }, {})
      ).sort(([,a], [,b]) => b - a).slice(0, 5)
    }
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null })
  }
}))