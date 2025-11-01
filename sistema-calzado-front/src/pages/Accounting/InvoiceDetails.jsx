import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  FileText,
  Calendar,
  User,
  Building,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Printer
} from 'lucide-react'
import { accountingService } from '../../services/accountingService'
import toast from 'react-hot-toast'

const InvoiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])

  // Cargar datos de la factura al montar el componente
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const invoiceData = await accountingService.getInvoiceById(id)
        setInvoice(invoiceData)
        
        // Cargar pagos relacionados
        const paymentsData = await accountingService.getPaymentsByInvoice(id)
        setPayments(paymentsData)
      } catch (error) {
        toast.error('Error al cargar datos de la factura')
        navigate('/accounting/invoices')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoiceData()
  }, [id, navigate])

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
      month: 'long',
      day: 'numeric'
    })
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

  const getDaysOverdue = (dueDateString) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.info('Función de descarga PDF próximamente')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Factura no encontrada</h3>
        <p className="text-gray-500 mb-4">La factura que buscas no existe o ha sido eliminada</p>
        <Link to="/accounting/invoices" className="btn btn-primary">
          Volver a facturas
        </Link>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(invoice.status)
  const daysOverdue = getDaysOverdue(invoice.dueDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/accounting/invoices')}
            className="btn btn-sm btn-secondary mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalles de Factura</h1>
            <p className="mt-1 text-sm text-gray-500">
              Factura {invoice.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="card">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Factura</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Número de Factura</p>
                      <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Emisión</p>
                      <p className="text-sm font-medium">{formatDate(invoice.issueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                      <p className={`text-sm font-medium ${daysOverdue > 0 ? 'text-red-600' : ''}`}>
                        {formatDate(invoice.dueDate)}
                        {daysOverdue > 0 && (
                          <span className="ml-1">({daysOverdue} días vencida)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <StatusIcon className={`h-5 w-5 mr-3 ${
                      invoice.status === 'PAID' ? 'text-green-500' :
                      invoice.status === 'PARTIAL' ? 'text-yellow-500' :
                      invoice.status === 'OVERDUE' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <span className={`badge ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Proveedor</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="text-sm font-medium">{invoice.providerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Documento</p>
                      <p className="text-sm font-medium">{invoice.providerDocument}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Resumen Financiero</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Saldo:</span>
                      <span className={`font-bold text-lg ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(invoice.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción y notas */}
      {(invoice.description || invoice.notes) && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
            {invoice.description && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                <p className="text-gray-600">{invoice.description}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notas</p>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagos realizados */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Pagos Realizados</h3>
          </div>
          
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Referencia</th>
                    <th>Registrado por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-mono">{payment.paymentNumber}</td>
                      <td>{formatDate(payment.paymentDate)}</td>
                      <td className="font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                      <td>
                        <span className="badge badge-secondary">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td>{payment.referenceNumber || '-'}</td>
                      <td>{payment.userName || '-'}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toast.info('Ver detalles próximamente')}
                            className="btn btn-sm btn-secondary"
                            title="Ver detalles"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
              <p className="text-gray-500 mb-4">
                Esta factura aún no tiene pagos registrados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetails