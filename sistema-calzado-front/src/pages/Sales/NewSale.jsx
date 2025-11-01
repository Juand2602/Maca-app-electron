import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  X, 
  Search,
  User,
  Phone,
  Calculator,
  CreditCard,
  ShoppingCart,
  DollarSign
} from 'lucide-react'
import { useSalesStore } from '../../store/salesStore'
import { useInventoryStore } from '../../store/inventoryStore'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NewSale = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createSale } = useSalesStore()
  const { fetchProducts, products } = useInventoryStore()
  
  const [availableProducts, setAvailableProducts] = useState([])
  const [searchProduct, setSearchProduct] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [showProductSearch, setShowProductSearch] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      customer: {
        name: '',
        phone: '',
        document: ''
      },
      items: [],
      paymentType: 'SINGLE',
      payments: [{
        paymentMethod: 'CASH',
        amount: '', // Cambiado de 0 a string vacío para mostrar placeholder
        referenceNumber: '',
        notes: ''
      }],
      notes: ''
    }
  })

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  })

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control,
    name: 'payments'
  })

  const watchedItems = watch('items')
  const watchedPaymentType = watch('paymentType')
  const watchedPayments = watch('payments')

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts()
      
      const productsWithSizes = []
      
      products.forEach(product => {
        if (product.isActive) {
          product.stocks.forEach(stock => {
            if (stock.quantity > 0) {
              productsWithSizes.push({
                id: `${product.id}-${stock.size}`,
                productId: product.id,
                reference: product.code,
                name: product.name,
                size: stock.size,
                price: product.salePrice,
                availableStock: stock.quantity,
                category: product.category,
                color: product.color
              })
            }
          })
        }
      })
      
      setAvailableProducts(productsWithSizes)
    }
    
    loadProducts()
  }, [fetchProducts, products])

  useEffect(() => {
    if (searchProduct) {
      const filtered = availableProducts.filter(product =>
        product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        product.reference.toLowerCase().includes(searchProduct.toLowerCase()) ||
        product.category.toLowerCase().includes(searchProduct.toLowerCase())
      )
      setFilteredProducts(filtered.slice(0, 10))
    } else {
      setFilteredProducts([])
    }
  }, [searchProduct, availableProducts])

  // Sincronizar pagos con el total cuando cambia
  useEffect(() => {
    const total = calculateTotal()
    if (watchedPaymentType === 'SINGLE' && watchedPayments.length > 0) {
      setValue('payments.0.amount', total)
    }
  }, [watchedItems, watchedPaymentType])

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => {
      const quantity = parseInt(item.quantity) || 0
      const price = parseFloat(item.unitPrice) || 0
      return sum + (quantity * price)
    }, 0)
  }

  const calculateTotalDiscount = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.discount) || 0)
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount()
  }

  const calculateTotalPayments = () => {
    return watchedPayments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount) || 0)
    }, 0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const addProduct = (product) => {
    const existingIndex = watchedItems.findIndex(item => 
      item.productId === product.productId && item.size === product.size
    )

    if (existingIndex >= 0) {
      const currentQuantity = parseInt(watchedItems[existingIndex].quantity) || 0
      if (currentQuantity < product.availableStock) {
        setValue(`items.${existingIndex}.quantity`, currentQuantity + 1)
        updateItemTotal(existingIndex)
      } else {
        toast.error('No hay suficiente stock disponible')
      }
    } else {
      appendItem({
        productId: product.productId,
        reference: product.reference,
        name: product.name,
        size: product.size,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        total: product.price,
        availableStock: product.availableStock
      })
    }

    setSearchProduct('')
    setShowProductSearch(false)
  }

  const updateItemTotal = (index) => {
    const item = watchedItems[index]
    const quantity = parseInt(item.quantity) || 0
    const unitPrice = parseFloat(item.unitPrice) || 0
    const discount = parseFloat(item.discount) || 0
    const total = (quantity * unitPrice) - discount
    setValue(`items.${index}.total`, total)
  }

  const handleQuantityChange = (index, newQuantity) => {
    const item = watchedItems[index]
    if (newQuantity > item.availableStock) {
      toast.error(`Stock máximo disponible: ${item.availableStock}`)
      return
    }
    setValue(`items.${index}.quantity`, newQuantity)
    updateItemTotal(index)
  }

  const handlePaymentTypeChange = (type) => {
    setValue('paymentType', type)
    
    if (type === 'SINGLE') {
      // Reset a un solo pago
      setValue('payments', [{
        paymentMethod: 'CASH',
        amount: calculateTotal(),
        referenceNumber: '',
        notes: ''
      }])
    } else {
      // Pago mixto - iniciar con dos métodos vacíos
      setValue('payments', [
        {
          paymentMethod: 'CASH',
          amount: '', // Cambiado de 0 a string vacío para mostrar placeholder
          referenceNumber: '',
          notes: ''
        },
        {
          paymentMethod: 'CARD',
          amount: '', // Cambiado de 0 a string vacío para mostrar placeholder
          referenceNumber: '',
          notes: ''
        }
      ])
    }
  }

  const onSubmit = async (data) => {
    try {
      // Validaciones
      if (data.items.length === 0) {
        throw new Error('Debe agregar al menos un producto')
      }

      if (!data.customer.name.trim()) {
        throw new Error('El nombre del cliente es requerido')
      }

      const total = calculateTotal()
      const totalPayments = calculateTotalPayments()

      if (totalPayments < total) {
        throw new Error(`Los pagos son insuficientes. Total: ${formatCurrency(total)}, Pagado: ${formatCurrency(totalPayments)}`)
      }

      // Preparar datos para la venta
      const saleData = {
        customerName: data.customer.name.trim(),
        customerDocument: data.customer.document || '',
        customerPhone: data.customer.phone || '',
        discount: calculateTotalDiscount(),
        tax: 0,
        notes: data.notes || '',
        items: data.items.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: parseInt(item.quantity)
        })),
        payments: data.payments.map(payment => ({
          paymentMethod: payment.paymentMethod,
          amount: parseFloat(payment.amount) || 0, // Asegurar que sea un número
          referenceNumber: payment.referenceNumber || null,
          notes: payment.notes || null
        }))
      }

      // Crear la venta
      const result = await createSale(saleData)
      
      if (result.success) {
        toast.success('Venta registrada exitosamente')
        navigate('/sales')
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error(error.message || 'Error al registrar la venta')
    }
  }

  const total = calculateTotal()
  const totalPayments = calculateTotalPayments()
  const difference = totalPayments - total

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
            <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
            <p className="text-sm text-gray-500">
              Registro de venta - {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      {...register('customer.name', {
                        required: 'El nombre es requerido'
                      })}
                      type="text"
                      className={`input ${errors.customer?.name ? 'input-error' : ''}`}
                      placeholder="Nombre del cliente"
                    />
                    {errors.customer?.name && (
                      <p className="mt-1 text-sm text-danger-600">{errors.customer.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento
                    </label>
                    <input
                      {...register('customer.document')}
                      type="text"
                      className="input"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      {...register('customer.phone')}
                      type="tel"
                      className="input"
                      placeholder="3001234567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Search */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Buscar Productos
                </h3>
              </div>
              <div className="card-body">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => {
                      setSearchProduct(e.target.value)
                      setShowProductSearch(!!e.target.value)
                    }}
                    className="input pl-10"
                    placeholder="Buscar por nombre, referencia o categoría..."
                  />
                  
                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProduct(product)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                {product.reference} - Talla {product.size} - {product.color}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                              <p className="text-xs text-gray-500">Stock: {product.availableStock}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Products */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Productos Seleccionados ({itemFields.length})
                </h3>
              </div>
              <div className="card-body p-0">
                {itemFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay productos seleccionados</p>
                    <p className="text-sm">Busca y agrega productos arriba</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {itemFields.map((field, index) => {
                      const item = watchedItems[index] || {}
                      return (
                        <div key={field.id} className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">
                                {item.reference} - Talla {item.size}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, Math.max(1, (parseInt(item.quantity) || 1) - 1))}
                                className="btn btn-sm btn-secondary"
                                disabled={parseInt(item.quantity) <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                {...register(`items.${index}.quantity`, {
                                  onChange: () => updateItemTotal(index)
                                })}
                                type="number"
                                className="input text-center w-16"
                                min="1"
                                max={item.availableStock}
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, (parseInt(item.quantity) || 1) + 1)}
                                className="btn btn-sm btn-secondary"
                                disabled={parseInt(item.quantity) >= item.availableStock}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-right min-w-[120px]">
                              <p className="font-medium">{formatCurrency(parseFloat(item.unitPrice) || 0)}</p>
                              <p className="text-sm text-gray-500">c/u</p>
                            </div>

                            <div className="min-w-[80px]">
                              <input
                                {...register(`items.${index}.discount`, {
                                  onChange: () => updateItemTotal(index)
                                })}
                                type="number"
                                className="input text-right"
                                placeholder="0"
                                min="0"
                                max={parseFloat(item.unitPrice) * parseInt(item.quantity)}
                              />
                              <p className="text-xs text-gray-500 mt-1">Descuento</p>
                            </div>

                            <div className="text-right min-w-[120px]">
                              <p className="font-bold text-lg">{formatCurrency(parseFloat(item.total) || 0)}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="btn btn-sm btn-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <input type="hidden" {...register(`items.${index}.productId`)} />
                          <input type="hidden" {...register(`items.${index}.reference`)} />
                          <input type="hidden" {...register(`items.${index}.name`)} />
                          <input type="hidden" {...register(`items.${index}.size`)} />
                          <input type="hidden" {...register(`items.${index}.unitPrice`)} />
                          <input type="hidden" {...register(`items.${index}.total`)} />
                          <input type="hidden" {...register(`items.${index}.availableStock`)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Sale Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Resumen de Venta
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descuento:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(calculateTotalDiscount())}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-xl text-primary-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Método de Pago
                </h3>
              </div>
              <div className="card-body space-y-4">
                {/* Tipo de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePaymentTypeChange('SINGLE')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                        watchedPaymentType === 'SINGLE'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Único
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentTypeChange('MIXED')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                        watchedPaymentType === 'MIXED'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Mixto
                    </button>
                  </div>
                </div>

                {/* Pagos */}
                <div className="space-y-3">
                  {paymentFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Pago {index + 1}
                          </span>
                          {watchedPaymentType === 'MIXED' && paymentFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePayment(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Método</label>
                          <select
                            {...register(`payments.${index}.paymentMethod`)}
                            className="select w-full"
                            disabled={watchedPaymentType === 'SINGLE'}
                          >
                            <option value="CASH">Efectivo</option>
                            <option value="CARD">Tarjeta</option>
                            <option value="TRANSFER">Transferencia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Monto</label>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-gray-500 text-sm">$</span>
                            <input
                              {...register(`payments.${index}.amount`)}
                              type="number"
                              className="input pl-6 text-right"
                              placeholder="0"
                              min="0"
                              readOnly={watchedPaymentType === 'SINGLE'}
                            />
                          </div>
                        </div>

                        {watchedPaymentType === 'MIXED' && (
                          <>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Referencia (Opcional)</label>
                              <input
                                {...register(`payments.${index}.referenceNumber`)}
                                type="text"
                                className="input text-sm"
                                placeholder="Ej: #1234, Aprobación: ABC"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {watchedPaymentType === 'MIXED' && (
                    <button
                      type="button"
                      onClick={() => appendPayment({
                        paymentMethod: 'CASH',
                        amount: '', // Cambiado de 0 a string vacío para mostrar placeholder
                        referenceNumber: '',
                        notes: ''
                      })}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Método de Pago
                    </button>
                  )}
                </div>

                {/* Resumen de Pagos */}
                <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total venta:</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total pagos:</span>
                    <span className="font-medium">{formatCurrency(totalPayments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-semibold ${
                      difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {difference >= 0 ? 'Cambio:' : 'Faltante:'}
                    </span>
                    <span className={`font-bold ${
                      difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(difference))}
                    </span>
                  </div>
                </div>

                {difference < 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      <strong>Pago insuficiente:</strong> Faltan {formatCurrency(Math.abs(difference))}
                    </p>
                  </div>
                )}

                {watchedPaymentType === 'MIXED' && difference > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Nota:</strong> El cliente pagó {formatCurrency(difference)} de más
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Notas</h3>
              </div>
              <div className="card-body">
                <textarea
                  {...register('notes')}
                  className="textarea"
                  rows={3}
                  placeholder="Notas adicionales sobre la venta..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={itemFields.length === 0 || difference < 0}
                className={`btn btn-success w-full py-3 text-lg ${
                  itemFields.length === 0 || difference < 0 ? 'btn-disabled' : ''
                }`}
              >
                <Save className="h-5 w-5 mr-2" />
                Confirmar Venta
              </button>
              
              <Link
                to="/sales"
                className="btn btn-secondary w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Link>
            </div>

            {/* Quick Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Información Rápida</h4>
              <div className="space-y-1 text-xs text-blue-600">
                <p>• Productos: {itemFields.length}</p>
                <p>• Unidades: {watchedItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}</p>
                <p>• Métodos de pago: {paymentFields.length}</p>
                <p>• Empleado: {user?.firstName} {user?.lastName}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewSale