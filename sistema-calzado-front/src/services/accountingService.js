import api from './api'

export const accountingService = {
  // ===== SERVICIOS DE FACTURAS =====

  // Obtener todas las facturas
  async getInvoices(params = {}) {
    try {
      const response = await api.get('/accounting/invoices', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener facturas:', error)
      throw error
    }
  },

  // Obtener factura por ID
  async getInvoiceById(id) {
    try {
      const response = await api.get(`/accounting/invoices/${id}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener factura:', error)
      throw error
    }
  },

  // Crear nueva factura
  async createInvoice(invoiceData) {
    try {
      console.log('Enviando datos al backend:', invoiceData)
      const response = await api.post('/accounting/invoices', invoiceData)
      console.log('Respuesta del backend:', response.data)
      
      // El backend devuelve directamente la factura creada
      return response.data
    } catch (error) {
      console.error('Error al crear factura:', error)
      
      // Mejorar el manejo de errores para mostrar el mensaje específico del backend
      if (error.response) {
        console.error('Respuesta de error:', error.response)
        if (error.response.data) {
          console.error('Datos de error:', error.response.data)
          
          // Si el backend devuelve un objeto con un campo 'error' o 'message'
          if (error.response.data.error) {
            throw new Error(error.response.data.error)
          } else if (error.response.data.message) {
            throw new Error(error.response.data.message)
          } else {
            // Si es un objeto, intentar convertirlo a string
            throw new Error(JSON.stringify(error.response.data))
          }
        }
      }
      
      throw error
    }
  },

  // Eliminar factura
  async deleteInvoice(id) {
    try {
      const response = await api.delete(`/accounting/invoices/${id}`)
      return response.data
    } catch (error) {
      console.error('Error al eliminar factura:', error)
      throw error
    }
  },

  // Obtener facturas por estado
  async getInvoicesByStatus(status) {
    try {
      const response = await api.get(`/accounting/invoices/status/${status}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener facturas por estado:', error)
      throw error
    }
  },

  // Obtener facturas por proveedor
  async getInvoicesByProvider(providerId) {
    try {
      const response = await api.get(`/accounting/invoices/provider/${providerId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener facturas del proveedor:', error)
      throw error
    }
  },

  // Obtener facturas vencidas
  async getOverdueInvoices() {
    try {
      const response = await api.get('/accounting/invoices/overdue')
      return response.data
    } catch (error) {
      console.error('Error al obtener facturas vencidas:', error)
      throw error
    }
  },

  // ===== SERVICIOS DE PAGOS =====

  // Crear nuevo pago
  async createPayment(paymentData) {
    try {
      // El token ya se agrega automáticamente en el interceptor de axios
      const response = await api.post('/accounting/payments', paymentData)
      
      // Si llegamos aquí, la petición fue exitosa (código 2xx)
      // Devolvemos los datos de la respuesta o un objeto de éxito genérico
      return response.data || { success: true }
    } catch (error) {
      console.error('Error al crear pago:', error)
      
      // Mejorar el manejo de errores para mostrar el mensaje específico del backend
      if (error.response) {
        console.error('Respuesta de error:', error.response)
        if (error.response.data) {
          console.error('Datos de error:', error.response.data)
          
          // Si el backend devuelve un objeto con un campo 'error' o 'message'
          if (error.response.data.error) {
            throw new Error(error.response.data.error)
          } else if (error.response.data.message) {
            throw new Error(error.response.data.message)
          } else {
            // Si es un objeto, intentar convertirlo a string
            throw new Error(JSON.stringify(error.response.data))
          }
        }
      }
      
      throw error
    }
  },

  // Obtener pagos por factura
  async getPaymentsByInvoice(invoiceId) {
    try {
      const response = await api.get(`/accounting/payments/invoice/${invoiceId}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener pagos de la factura:', error)
      throw error
    }
  },

  // ===== SERVICIOS DE REPORTES =====

  // Obtener estadísticas generales
  async getAccountingStats(params = {}) {
    try {
      const response = await api.get('/accounting/reports/summary', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw error
    }
  },

  // Obtener reporte de balance general
  async getBalanceSheet(params = {}) {
    try {
      const response = await api.get('/accounting/reports/balance-sheet', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener balance general:', error)
      throw error
    }
  },

  // Obtener reporte de cuentas por pagar
  async getAccountsPayable(params = {}) {
    try {
      const response = await api.get('/accounting/reports/accounts-payable', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener cuentas por pagar:', error)
      throw error
    }
  },

  // Obtener reporte de flujo de caja
  async getCashFlow(params = {}) {
    try {
      const response = await api.get('/accounting/reports/cash-flow', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener flujo de caja:', error)
      throw error
    }
  },

  // Obtener reporte de ingresos
  async getIncomeStatement(params = {}) {
    try {
      const response = await api.get('/accounting/reports/income-statement', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener estado de resultados:', error)
      throw error
    }
  },

  // Obtener reporte por proveedor
  async getProviderReport(providerId, params = {}) {
    try {
      const response = await api.get(`/accounting/reports/provider/${providerId}`, { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener reporte del proveedor:', error)
      throw error
    }
  },

  // Obtener reporte de vencimientos
  async getDueDatesReport(params = {}) {
    try {
      const response = await api.get('/accounting/reports/due-dates', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener reporte de vencimientos:', error)
      throw error
    }
  },

  // ===== SERVICIOS DE EXPORTACIÓN =====

  // Exportar facturas a Excel
  async exportInvoicesToExcel(params = {}) {
    try {
      const response = await api.get('/accounting/exports/invoices/excel', { 
        params,
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error al exportar facturas:', error)
      throw error
    }
  },

  // Exportar reporte a PDF
  async exportReportToPdf(reportType, params = {}) {
    try {
      const response = await api.get(`/accounting/exports/reports/${reportType}/pdf`, { 
        params,
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error al exportar reporte:', error)
      throw error
    }
  },

  // ===== SERVICIOS DE CONFIGURACIÓN =====

  // Obtener configuración contable
  async getAccountingSettings() {
    try {
      const response = await api.get('/accounting/settings')
      return response.data
    } catch (error) {
      console.error('Error al obtener configuración:', error)
      throw error
    }
  },

  // Actualizar configuración contable
  async updateAccountingSettings(settings) {
    try {
      const response = await api.put('/accounting/settings', settings)
      return response.data
    } catch (error) {
      console.error('Error al actualizar configuración:', error)
      throw error
    }
  },

  // ===== UTILIDADES =====

  // Validar número de factura único
  async validateInvoiceNumber(invoiceNumber, excludeId = null) {
    try {
      const response = await api.post('/accounting/invoices/validate-number', {
        invoiceNumber,
        excludeId
      })
      return response.data
    } catch (error) {
      console.error('Error al validar número de factura:', error)
      throw error
    }
  },

  // Calcular totales de factura
  calculateInvoiceTotals(items, discount = 0, taxRate = 0.19) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const tax = subtotal * taxRate
    const total = subtotal + tax - discount

    return {
      subtotal,
      tax,
      discount,
      total
    }
  },

  // Formatear moneda
  formatCurrency(amount, currency = 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  },

  // Generar número de factura
  generateInvoiceNumber(year = null, sequence = 1) {
    const currentYear = year || new Date().getFullYear()
    return `FAC-${currentYear}-${sequence.toString().padStart(3, '0')}`
  },

  // Generar número de pago
  generatePaymentNumber(year = null, sequence = 1) {
    const currentYear = year || new Date().getFullYear()
    return `PAG-${currentYear}-${sequence.toString().padStart(3, '0')}`
  },

  // Calcular días de vencimiento
  calculateDaysOverdue(dueDate) {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  },

  // Obtener estado de factura basado en fechas y pagos
  getInvoiceStatus(invoice) {
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    const isOverdue = today > dueDate

    if (invoice.balance === 0) {
      return 'PAID'
    } else if (invoice.paidAmount > 0) {
      return isOverdue ? 'OVERDUE' : 'PARTIAL'
    } else {
      return isOverdue ? 'OVERDUE' : 'PENDING'
    }
  },

  // Preparar datos para exportación
  prepareExportData(data, type = 'invoices') {
    return data.map(item => {
      if (type === 'invoices') {
        return {
          'Número': item.invoiceNumber,
          'Fecha': new Date(item.issueDate).toLocaleDateString('es-ES'),
          'Proveedor': item.providerName,
          'Subtotal': item.subtotal,
          'IVA': item.tax,
          'Descuento': item.discount,
          'Total': item.total,
          'Pagado': item.paidAmount,
          'Saldo': item.balance,
          'Estado': item.status === 'PAID' ? 'Pagada' :
                   item.status === 'PARTIAL' ? 'Parcial' :
                   item.status === 'OVERDUE' ? 'Vencida' : 'Pendiente',
          'Vencimiento': new Date(item.dueDate).toLocaleDateString('es-ES'),
          'Notas': item.notes || ''
        }
      } else if (type === 'payments') {
        return {
          'Número': item.paymentNumber,
          'Fecha': new Date(item.paymentDate).toLocaleDateString('es-ES'),
          'Factura': item.invoiceNumber,
          'Proveedor': item.providerName,
          'Monto': item.amount,
          'Método': item.paymentMethod,
          'Referencia': item.referenceNumber || '',
          'Estado': item.status === 'completed' ? 'Completado' :
                   item.status === 'pending' ? 'Pendiente' : 'Fallido',
          'Notas': item.notes || ''
        }
      }
      return item
    })
  }
}