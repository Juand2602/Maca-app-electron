import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save,
  X,
  Plus,
  Trash2,
  Package
} from 'lucide-react'
import { accountingService } from '../../services/accountingService'
import { providersService } from '../../services/providersService'
import { inventoryService } from '../../services/inventoryService'
import toast from 'react-hot-toast'

const AddInvoice = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedItemIndex, setSelectedItemIndex] = useState(null)

  const tableWrapperRef = useRef(null)
  const [suggestionStyle, setSuggestionStyle] = useState(null)

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    providerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    description: '',
    notes: ''
  })

  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, total: 0, productId: null }
  ])

  // Cargar proveedores y productos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const providersData = await providersService.getAllProviders()
        setProviders(providersData)
        setLoadingProviders(false)

        const productsData = await inventoryService.getAllProducts()
        setProducts(productsData)
        setFilteredProducts(productsData)
        setLoadingProducts(false)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        toast.error('Error al cargar datos iniciales')
        setLoadingProviders(false)
        setLoadingProducts(false)
      }
    }

    fetchData()
  }, [])

  // Generar número de factura automáticamente
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

    setFormData(prev => ({
      ...prev,
      invoiceNumber: `FAC-${year}${month}${day}-${random}`
    }))
  }, [])

  // Calcular totales cuando cambian los ítems o descuento
  useEffect(() => {
    calculateTotals()
  }, [items, formData.discount])

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
    const tax = subtotal * 0.19 // 19% IVA
    const total = subtotal + tax - (parseFloat(formData.discount) || 0)

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items]
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index][field] = value
      const quantity = parseFloat(updatedItems[index].quantity) || 0
      const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0
      updatedItems[index].total = quantity * unitPrice
    } else {
      updatedItems[index][field] = value
    }

    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === parseInt(value))
      if (selectedProduct) {
        updatedItems[index].description = selectedProduct.name
        updatedItems[index].unitPrice = selectedProduct.salePrice
        updatedItems[index].total = (parseFloat(updatedItems[index].quantity) || 0) * selectedProduct.salePrice
      }
    }

    setItems(updatedItems)
  }

  const handleDescriptionChange = (index, value) => {
    const updatedItems = [...items]
    updatedItems[index].description = value

    if (value.trim() !== '') {
      const filtered = products.filter(product =>
        (product.name || '').toLowerCase().includes(value.toLowerCase()) ||
        (product.code || '').toLowerCase().includes(value.toLowerCase()) ||
        ((product.brand || '').toLowerCase().includes(value.toLowerCase()))
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }

    setItems(updatedItems)
  }

  const selectProduct = (index, product) => {
    const updatedItems = [...items]
    updatedItems[index].description = product.name
    updatedItems[index].productId = product.id
    updatedItems[index].unitPrice = product.salePrice
    updatedItems[index].total = (parseFloat(updatedItems[index].quantity) || 0) * product.salePrice
    setItems(updatedItems)
    setFilteredProducts([])
    setSelectedItemIndex(null)
    setSuggestionStyle(null)
  }

  // Mostrar sugerencias: calculamos top y ancho relativo al wrapper
  const showProductSuggestions = (index, e) => {
    setSelectedItemIndex(index)
    setFilteredProducts(products)

    try {
      const wrapperRect = tableWrapperRef.current?.getBoundingClientRect()
      const inputRect = e?.target?.getBoundingClientRect()
      if (wrapperRect && inputRect) {
        // top relativo al wrapper
        const top = inputRect.bottom - wrapperRect.top + 6 // separación
        // left: 0 para alinear al inicio del wrapper
        const left = 0
        // ancho: todo el ancho del wrapper
        const width = wrapperRect.width
        setSuggestionStyle({ top: `${top}px`, left: `${left}px`, width: `${width}px` })
      } else {
        setSuggestionStyle(null)
      }
    } catch (err) {
      setSuggestionStyle(null)
    }
  }

  // Cerrar dropdown si se hace click fuera del wrapper
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableWrapperRef.current && !tableWrapperRef.current.contains(e.target)) {
        setSelectedItemIndex(null)
        setFilteredProducts([])
        setSuggestionStyle(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0, productId: null }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index)
      setItems(updatedItems)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (!formData.providerId) {
        throw new Error('Debe seleccionar un proveedor')
      }

      if (items.some(item => !item.description || (parseFloat(item.quantity) || 0) <= 0 || (parseFloat(item.unitPrice) || 0) <= 0)) {
        throw new Error('Todos los ítems deben tener descripción, cantidad y precio unitario válidos')
      }

      if ((parseFloat(formData.total) || 0) <= 0) {
        throw new Error('El total de la factura debe ser mayor a cero')
      }

      setIsLoading(true)

      const itemsDescription = items.map(item =>
        `${item.description} - ${item.quantity} unidades`
      ).join(', ');

      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        providerId: parseInt(formData.providerId),
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        total: formData.total,
        description: itemsDescription,
        notes: formData.notes
      }

      console.log('Datos enviados al backend:', invoiceData)

      try {
        const response = await accountingService.createInvoice(invoiceData)
        console.log('Respuesta del backend:', response)

        if (response && response.id) {
          toast.success('Factura creada exitosamente')
          navigate('/accounting/invoices')
        } else {
          throw new Error('Respuesta inválida del servidor')
        }
      } catch (apiError) {
        console.error('Error de API:', apiError)
        let errorMessage = 'Error al crear factura'
        if (apiError.response) {
          if (apiError.response.data) {
            if (typeof apiError.response.data === 'string') {
              errorMessage = apiError.response.data
            } else if (apiError.response.data.message) {
              errorMessage = apiError.response.data.message
            } else if (apiError.response.data.error) {
              errorMessage = apiError.response.data.error
            } else {
              errorMessage = JSON.stringify(apiError.response.data)
            }
          }
        } else if (apiError.message) {
          errorMessage = apiError.message
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error completo:', error)
      toast.error(error.message || 'Error al crear factura')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Factura</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registra una nueva factura de proveedor
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate('/accounting/invoices')}
            className="btn btn-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
        </div>
      </div>

      {/* Formulario */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor *
                </label>
                {loadingProviders ? (
                  <div className="flex items-center justify-center h-10">
                    <div className="spinner h-5 w-5"></div>
                  </div>
                ) : (
                  <select
                    name="providerId"
                    value={formData.providerId}
                    onChange={handleInputChange}
                    className="select"
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} ({provider.document})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Ítems de la factura - Sección más alta */}
            <div className="min-h-[600px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Ítems de la Factura</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-sm btn-secondary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Ítem
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Los ítems se guardarán en formato legible (ej: "Zapatilla Run Pro - 2 unidades, Zapato Urban - 10 unidades").
                </p>
              </div>

              {/* Tabla: ocupa toda la altura del wrapper (la sección "Ítems de la Factura" tiene min-h) */}
              <div className="relative h-full" ref={tableWrapperRef}>
                {/* Tabla con header fijo */}
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Descripción</th>
                        <th className="text-left">Cantidad</th>
                        <th className="text-left">Precio Unitario</th>
                        <th className="text-left">Total</th>
                        <th className="text-left">Acciones</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Filas en contenedor que ocupa el resto de la altura y es scrollable.
                    Ajusta el valor 56px si el header tiene otra altura */}
                <div
                  className="overflow-auto"
                  style={{ height: 'calc(100% - 56px)' }}
                >
                  <table className="table w-full">
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="align-top">
                          <td className="relative py-4">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                onFocus={(e) => showProductSuggestions(index, e)}
                                className="input w-full pr-8"
                                placeholder="Buscar producto o escribir descripción"
                                required
                              />
                              <Package className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
                            </div>
                          </td>

                          <td className="py-4">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="input w-full"
                              min="1"
                              step="0.01"
                              required
                            />
                          </td>

                          <td className="py-4">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-gray-500">$</span>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                className="input pl-6 w-full"
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                          </td>

                          <td className="py-4 font-medium">
                            {formatCurrency(item.total)}
                          </td>

                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="btn btn-sm btn-danger"
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Dropdown de sugerencias (posicionado dentro del wrapper) */}
                {selectedItemIndex !== null && filteredProducts.length > 0 && suggestionStyle && (
                  <div
                    style={{
                      position: 'absolute',
                      zIndex: 50,
                      top: suggestionStyle.top,
                      left: suggestionStyle.left,
                      width: suggestionStyle.width,
                      maxHeight: '360px',
                      overflow: 'auto',
                    }}
                    className="bg-white border border-gray-200 rounded-md shadow-lg"
                  >
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectProduct(selectedItemIndex, product)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 mt-1">Código: {product.code}</div>
                            <div className="text-sm text-gray-500">Marca: {product.brand || 'Sin marca'}</div>
                            <div className="text-sm text-gray-500">Categoría: {product.category}</div>
                            {product.color && <div className="text-sm text-gray-500">Color: {product.color}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-lg text-primary-600">{formatCurrency(product.salePrice)}</div>
                            <div className="text-sm text-gray-500">Precio de compra: {formatCurrency(product.purchasePrice)}</div>
                            <div className="text-sm text-gray-500 mt-1">Stock: {product.totalStock || 0}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Resumen Financiero</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">IVA (19%):</span>
                    <span className="font-medium">{formatCurrency(formData.tax)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <label className="text-gray-600">Descuento:</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-gray-500">$</span>
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleInputChange}
                        className="input pl-6 w-24 text-right"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(formData.total)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea w-full"
                    rows={4}
                    placeholder="Notas adicionales sobre la factura..."
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/accounting/invoices')}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner h-4 w-4 mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Factura
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddInvoice
