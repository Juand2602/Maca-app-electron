import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  Package,
  Receipt,
  FileText,
  DollarSign,
  Banknote
} from 'lucide-react'
import { useSalesStore } from '../../store/salesStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const SaleDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchSaleById } = useSalesStore()
  const { isAdmin } = useAuthStore()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSaleDetails()
  }, [id])

  const loadSaleDetails = async () => {
    setLoading(true)
    try {
      const result = await fetchSaleById(id)
      if (result.success) {
        setSale(result.sale)
      } else {
        toast.error(result.error || 'Error al cargar la venta')
        navigate('/sales')
      }
    } catch (error) {
      console.error('Error loading sale:', error)
      toast.error('Error al cargar la venta')
      navigate('/sales')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'MIXED': 'Mixto'
    }
    return labels[method] || method
  }

  const printSale = () => {
    const printContent = generatePrintContent(sale)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const generatePrintContent = (sale) => {
    // Generar sección de pagos
    const paymentsHtml = sale.payments && sale.payments.length > 0
      ? sale.payments.map(payment => `
          <div class="item">
            <span>${getPaymentMethodLabel(payment.paymentMethod)}${payment.referenceNumber ? ` (${payment.referenceNumber})` : ''}:</span>
            <span>${formatCurrency(payment.amount)}</span>
          </div>
        `).join('')
      : `
          <div class="item">
            <span>${getPaymentMethodLabel(sale.paymentMethod)}:</span>
            <span>${formatCurrency(sale.total)}</span>
          </div>
        `

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket de Venta #${sale.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4;
              max-width: 300px; 
              margin: 0 auto;
              padding: 10px;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px dashed #000; 
              padding-bottom: 10px; 
              margin-bottom: 10px; 
            }
            .title { 
              font-size: 16px; 
              font-weight: bold; 
            }
            .subtitle { 
              font-size: 10px; 
            }
            .section { 
              margin: 10px 0; 
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0; 
            }
            .total-section { 
              border-top: 1px dashed #000; 
              padding-top: 10px; 
              margin-top: 10px; 
            }
            .payment-section {
              background: #f5f5f5;
              padding: 5px;
              margin: 5px 0;
            }
            .footer { 
              text-align: center; 
              border-top: 1px dashed #000; 
              padding-top: 10px; 
              margin-top: 10px; 
              font-size: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SISTEMA ADMINISTRATIVO</div>
            <div class="subtitle">Empresa de Calzado</div>
            <div class="subtitle">Ticket de Venta</div>
          </div>
          
          <div class="section">
            <strong>Venta #${sale.id.toString().padStart(4, '0')}</strong><br>
            ${sale.saleNumber ? `Número: ${sale.saleNumber}<br>` : ''}
            Fecha: ${formatDate(sale.createdAt)}<br>
            Empleado: ${sale.userName}
          </div>
          
          <div class="section">
            <strong>CLIENTE:</strong><br>
            ${sale.customerName}<br>
            ${sale.customerPhone ? `Tel: ${sale.customerPhone}` : ''}
          </div>
          
          <div class="section">
            <strong>PRODUCTOS:</strong>
            ${sale.items.map(item => `
              <div class="item">
                <div>
                  ${item.productName} (${item.size})<br>
                  ${item.quantity} x ${formatCurrency(item.unitPrice)}
                </div>
                <div>${formatCurrency(item.subtotal)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            <div class="item">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="item">
                <span>Descuento:</span>
                <span>-${formatCurrency(sale.discount)}</span>
              </div>
            ` : ''}
            ${sale.tax > 0 ? `
              <div class="item">
                <span>IVA:</span>
                <span>${formatCurrency(sale.tax)}</span>
              </div>
            ` : ''}
            <div class="item">
              <strong>TOTAL:</strong>
              <strong>${formatCurrency(sale.total)}</strong>
            </div>
          </div>
          
          <div class="section">
            <strong>PAGO${sale.isMixedPayment ? 'S' : ''}:</strong>
            <div class="payment-section">
              ${paymentsHtml}
            </div>
          </div>
          
          ${sale.notes ? `
            <div class="section">
              <strong>NOTAS:</strong><br>
              ${sale.notes}
            </div>
          ` : ''}
          
          <div class="footer">
            ¡Gracias por su compra!<br>
            Sistema de Gestión v1.0.0
          </div>
        </body>
      </html>
    `
  }

  const downloadPDF = () => {
    toast.info('Función de exportar PDF próximamente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8 mr-3"></div>
        <span className="text-gray-600">Cargando detalles de venta...</span>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Venta no encontrada</h3>
        <p className="text-gray-500 mb-4">La venta que buscas no existe o ha sido eliminada.</p>
        <Link to="/sales" className="btn btn-primary">
          Volver a Ventas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/sales" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Venta #{sale.id.toString().padStart(4, '0')}
            </h1>
            <p className="text-sm text-gray-500">
              {formatDate(sale.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={printSale}
            className="btn btn-primary"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Información de la Venta
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">ID de Venta:</span>
                  <p className="text-gray-900 font-mono">#{sale.id.toString().padStart(4, '0')}</p>
                </div>
                {sale.saleNumber && (
                  <div>
                    <span className="font-medium text-gray-600">Número de Venta:</span>
                    <p className="text-gray-900 font-mono">{sale.saleNumber}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">Estado:</span>
                  <p>
                    <span className={`badge ${
                      sale.status === 'COMPLETED' ? 'badge-success' :
                      sale.status === 'PENDING' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {sale.status === 'COMPLETED' ? 'Completada' :
                       sale.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fecha y Hora:</span>
                  <p className="text-gray-900">{formatDate(sale.createdAt)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Empleado:</span>
                  <p className="text-gray-900">{sale.userName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Tipo de Pago:</span>
                  <p className="text-gray-900">
                    {sale.isMixedPayment ? (
                      <span className="badge badge-warning">
                        <CreditCard className="h-3 w-3 inline mr-1" />
                        Pago Mixto
                      </span>
                    ) : (
                      getPaymentMethodLabel(sale.paymentMethod)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Cliente
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-900">{sale.customerName}</p>
                  </div>
                </div>
                {sale.customerDocument && (
                  <div className="flex items-center space-x-3">
                    <Receipt className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Documento</p>
                      <p className="font-medium text-gray-900">{sale.customerDocument}</p>
                    </div>
                  </div>
                )}
                {sale.customerPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium text-gray-900">{sale.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Productos Vendidos ({sale.items.length})
              </h3>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {item.productCode} - Talla {item.size}
                            </p>
                          </div>
                        </td>
                        <td className="font-medium">{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td className="font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notas
                </h3>
              </div>
              <div className="card-body">
                <p className="text-gray-700">{sale.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Resumen de Pago
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                {sale.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">{formatCurrency(sale.tax)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-xl text-primary-600">{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Método{sale.isMixedPayment ? 's' : ''} de Pago
                </h4>
                
                {sale.payments && sale.payments.length > 0 ? (
                  <div className="space-y-3">
                    {sale.payments.map((payment, index) => (
                      <div 
                        key={payment.id || index} 
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {payment.paymentMethod === 'CASH' && <Banknote className="h-4 w-4 text-green-600" />}
                            {payment.paymentMethod === 'CARD' && <CreditCard className="h-4 w-4 text-blue-600" />}
                            {payment.paymentMethod === 'TRANSFER' && <DollarSign className="h-4 w-4 text-purple-600" />}
                            <span className="font-medium text-gray-900">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </span>
                          </div>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        
                        {payment.referenceNumber && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Ref:</span> {payment.referenceNumber}
                          </div>
                        )}
                        
                        {payment.notes && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {sale.isMixedPayment && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <p className="text-sm text-blue-700">
                          <strong>Total pagado:</strong> {formatCurrency(
                            sale.payments.reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {getPaymentMethodLabel(sale.paymentMethod)}:
                      </span>
                      <span className="font-medium">{formatCurrency(sale.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Productos diferentes:</span>
                <span className="font-medium">{sale.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unidades totales:</span>
                <span className="font-medium">
                  {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio promedio:</span>
                <span className="font-medium">
                  {formatCurrency(sale.total / sale.items.reduce((sum, item) => sum + item.quantity, 0))}
                </span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">% Descuento:</span>
                  <span className="font-medium text-red-600">
                    {((sale.discount / sale.subtotal) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {sale.isMixedPayment && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Métodos de pago:</span>
                  <span className="font-medium text-blue-600">
                    {sale.payments ? sale.payments.length : 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={printSale}
              className="btn btn-primary w-full"
            >
              <Printer className="h-4 w-4 mr-2" />
              Reimprimir Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaleDetails