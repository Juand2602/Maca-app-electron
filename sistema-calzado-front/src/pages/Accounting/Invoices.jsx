import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  Download,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useAccountingStore } from '../../store/accountingStore'
import { accountingService } from '../../services/accountingService'
import toast from 'react-hot-toast'

const Invoices = () => {
  const {
    getInvoices,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    isLoading
  } = useAccountingStore()

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedInvoices, setSelectedInvoices] = useState([])
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalInvoicesAmount: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    paidInvoices: 0,
    paidAmount: 0,
    partialInvoices: 0,
    partialAmount: 0,
    overdueInvoices: 0,
    monthlyStats: {
      invoicesCount: 0,
      invoicesAmount: 0,
      paymentsCount: 0,
      paymentsAmount: 0
    },
    yearlyStats: {
      invoicesCount: 0,
      invoicesAmount: 0,
      paymentsCount: 0,
      paymentsAmount: 0
    }
  })

  // Estados para modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'TRANSFER',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const invoicesData = await getInvoices()
        setInvoices(invoicesData)
        setFilteredInvoices(invoicesData)

        // Calcular estadísticas
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfYear = new Date(now.getFullYear(), 0, 1)

        const monthlyInvoices = invoicesData.filter(i => new Date(i.issueDate) >= startOfMonth)
        const yearlyInvoices = invoicesData.filter(i => new Date(i.issueDate) >= startOfYear)

        const newStats = {
          totalInvoices: invoicesData.length,
          totalInvoicesAmount: invoicesData.reduce((sum, i) => sum + (i.total || 0), 0),
          pendingInvoices: invoicesData.filter(i => i.status === 'PENDING').length,
          pendingAmount: invoicesData.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + (i.balance || 0), 0),
          paidInvoices: invoicesData.filter(i => i.status === 'PAID').length,
          paidAmount: invoicesData.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.total || 0), 0),
          partialInvoices: invoicesData.filter(i => i.status === 'PARTIAL').length,
          partialAmount: invoicesData.filter(i => i.status === 'PARTIAL').reduce((sum, i) => sum + (i.balance || 0), 0),
          overdueInvoices: invoicesData.filter(i => {
            const dueDate = new Date(i.dueDate)
            return dueDate < now && i.status !== 'PAID'
          }).length,
          monthlyStats: {
            invoicesCount: monthlyInvoices.length,
            invoicesAmount: monthlyInvoices.reduce((sum, i) => sum + (i.total || 0), 0),
            paymentsCount: 0,
            paymentsAmount: 0
          },
          yearlyStats: {
            invoicesCount: yearlyInvoices.length,
            invoicesAmount: yearlyInvoices.reduce((sum, i) => sum + (i.total || 0), 0),
            paymentsCount: 0,
            paymentsAmount: 0
          }
        }

        setStats(newStats)
      } catch (error) {
        console.error('Error cargando facturas', error)
        toast.error('Error al cargar datos de facturas')
      }
    }

    fetchData()
  }, [getInvoices])

  // Aplicar filtros cuando cambian los términos de búsqueda o los filtros
  useEffect(() => {
    applyFilters()
  }, [searchTerm, filters, invoices])

  const applyFilters = () => {
    let filtered = [...invoices]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.providerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filtros adicionales
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status)
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

    setFilteredInvoices(filtered)
    setCurrentPage(1) // Resetear a la primera página cuando se aplican filtros
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setFilters({
      dateRange: 'month',
      status: '',
      paymentMethod: ''
    })
  }

  // Paginación
  const indexOfLastInvoice = currentPage * itemsPerPage
  const indexOfFirstInvoice = indexOfLastInvoice - itemsPerPage
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysOverdue = (dueDateString) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'badge-success'
      case 'PARTIAL': return 'badge-warning'
      case 'OVERDUE': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'PAID': return 'Pagada'
      case 'PARTIAL': return 'Parcial'
      case 'OVERDUE': return 'Vencida'
      default: return 'Pendiente'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID': return CheckCircle
      case 'PARTIAL': return Clock
      case 'OVERDUE': return XCircle
      default: return AlertCircle
    }
  }

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const handleSelectAll = () => {
    if (selectedInvoices.length === currentInvoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(currentInvoices.map(invoice => invoice.id))
    }
  }

  const exportToExcel = () => {
    toast.info('Función de exportar próximamente')
  }

  // -----------------------
  // Payment modal handlers
  // -----------------------

  const handleRegisterPayment = (invoice) => {
    setSelectedInvoice(invoice)
    setPaymentForm({
      invoiceId: invoice.id,
      amount: '',
      paymentMethod: 'TRANSFER',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const handlePayTotal = () => {
    if (selectedInvoice) {
      setPaymentForm(prev => ({
        ...prev,
        amount: selectedInvoice.balance.toString()
      }))
    }
  }

  const submitPayment = async (e) => {
    e.preventDefault()
    try {
      if (!paymentForm.invoiceId) throw new Error('Factura no seleccionada')
      const amount = parseFloat(paymentForm.amount)
      if (isNaN(amount) || amount <= 0) throw new Error('Monto inválido')
      if (selectedInvoice && amount > (selectedInvoice.balance || 0)) {
        throw new Error('El monto no puede ser mayor al saldo pendiente')
      }

      setIsSubmittingPayment(true)

      // Construir payload (ajusta campos según tu backend)
      const payload = {
        invoiceId: parseInt(paymentForm.invoiceId),
        amount,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        paymentDate: paymentForm.date,
        notes: paymentForm.notes
      }

      // Intentar usar accountingService.createPayment si existe
      // TODO: si tu store tiene createPayment preferir usarla
      const result = await accountingService.createPayment(payload)
      
      // El pago se registró correctamente en la base de datos
      // Independientemente de la estructura de la respuesta, si no hay excepción, consideramos éxito
      toast.success('Pago registrado exitosamente')
      setShowPaymentModal(false)
      setPaymentForm({
        invoiceId: '',
        amount: '',
        paymentMethod: 'TRANSFER',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })

      // Refrescar facturas
      const refreshed = await getInvoices()
      setInvoices(refreshed)
      setFilteredInvoices(refreshed)
      
    } catch (err) {
      console.error('Error registrando pago:', err)
      toast.error(err.message || 'Error al registrar pago')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas de Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las facturas y cuentas por pagar
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/accounting/invoices/add" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.totalInvoicesAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pagadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.paidAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vencidas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueInvoices}</p>
                <p className="text-xs text-red-500">Requieren atención</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por número, proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              {(searchTerm || Object.values(filters).some(f => f && f !== 'month')) && (
                <button
                  onClick={clearAllFilters}
                  className="btn btn-secondary"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="select"
                  >
                    <option value="">Todos</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="PARTIAL">Parciales</option>
                    <option value="PAID">Pagadas</option>
                    <option value="OVERDUE">Vencidas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="select"
                  >
                    <option value="month">Este Mes</option>
                    <option value="week">Esta Semana</option>
                    <option value="year">Este Año</option>
                    <option value="all">Todas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="select"
                  >
                    <option value="">Todos</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner h-6 w-6 mr-3"></div>
              <span>Cargando facturas...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedInvoices.length === currentInvoices.length && currentInvoices.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th>Número</th>
                    <th>Fecha / Vencimiento</th>
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((invoice) => {
                    const StatusIcon = getStatusIcon(invoice.status)
                    const daysOverdue = getDaysOverdue(invoice.dueDate)

                    return (
                      <tr key={invoice.id} className={invoice.status === 'OVERDUE' ? 'bg-red-50' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectInvoice(invoice.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td>
                          <div>
                            <p className="font-mono font-medium text-primary-600">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {invoice.id}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(invoice.issueDate)}
                            </p>
                            <p className={`text-sm ${
                              daysOverdue > 0 ? 'text-red-600 font-medium' : 'text-gray-500'
                            }`}>
                              Vence: {formatDate(invoice.dueDate)}
                              {daysOverdue > 0 && (
                                <span className="ml-1">({daysOverdue} días vencida)</span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{invoice.providerName}</p>
                            <p className="text-sm text-gray-500">
                              {/* {invoice.items.length} ítem{invoice.items.length !== 1 ? 's' : ''} */}
                            </p>
                          </div>
                        </td>
                        <td className="font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="font-medium text-green-600">
                          {formatCurrency(invoice.paidAmount)}
                        </td>
                        <td className={`font-medium ${
                          invoice.balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(invoice.balance)}
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className={`badge ${getStatusColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <Link
                              to={`/accounting/invoices/${invoice.id}`}
                              className="btn btn-sm btn-secondary"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {/* Register payment opens modal inline */}
                            {invoice.balance > 0 && (
                              <button
                                onClick={() => handleRegisterPayment(invoice)}
                                className="btn btn-sm btn-success"
                                title="Registrar pago"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {indexOfFirstInvoice + 1} a {Math.min(indexOfLastInvoice, filteredInvoices.length)} de {filteredInvoices.length} facturas
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`btn btn-sm ${
                  currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredInvoices.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(f => f && f !== 'month') 
              ? 'No se encontraron facturas' 
              : 'No hay facturas registradas'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || Object.values(filters).some(f => f && f !== 'month')
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza registrando tu primera factura de proveedor'
            }
          </p>
          {!searchTerm && !Object.values(filters).some(f => f && f !== 'month') && (
            <Link to="/accounting/invoices/add" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Link>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedInvoices.length} factura{selectedInvoices.length !== 1 ? 's' : ''} seleccionada{selectedInvoices.length !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={exportToExcel}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedInvoices([])}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal (inline) */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Registrar Pago - {selectedInvoice.invoiceNumber}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={submitPayment}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="input pl-6 w-full"
                      placeholder="0"
                      min="1"
                      max={selectedInvoice.balance || ''}
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500">Saldo pendiente: {formatCurrency(selectedInvoice.balance)}</p>
                    <button
                      type="button"
                      onClick={handlePayTotal}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Pagar total
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="select w-full"
                  >
                    <option value="TRANSFER">Transferencia Bancaria</option>
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="input w-full"
                    placeholder="Número de transacción, cheque, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="textarea w-full"
                    rows={3}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="modal-footer flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingPayment}>
                  {isSubmittingPayment ? (
                    <>
                      <div className="spinner h-4 w-4 mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Registrar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoices