import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  User,
  Tag,
  Palette,
  Ruler,
  Trash2
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import useInventoryStore from '../../store/inventoryStore'
import toast from 'react-hot-toast'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const inventoryStore = useInventoryStore()
  
  // Extraer las funciones del store
  const { getProductById } = inventoryStore
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadProduct()
    }
  }, [id, isAuthenticated])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const foundProduct = await getProductById(id)
      
      if (foundProduct) {
        setProduct(foundProduct)
        setLoading(false)
      } else {
        toast.error('Producto no encontrado')
        navigate('/inventory')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Error al cargar el producto')
      navigate('/inventory')
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStockStatus = (product) => {
    if (product.totalStock === 0) {
      return { status: 'out', label: 'Sin Stock', color: 'bg-red-100 text-red-800' }
    } else if (product.isLowStock) {
      return { status: 'low', label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { status: 'good', label: 'Disponible', color: 'bg-green-100 text-green-800' }
    }
  }

  const handleToggleProductStatus = async () => {
    const isActive = product.isActive
    
    if (isActive) {
      // Desactivar producto
      if (window.confirm('¿Estás seguro de desactivar este producto?')) {
        try {
          const { inventoryService } = await import('../../services/inventoryService')
          await inventoryService.deleteProduct(product.id)
          toast.success('Producto desactivado exitosamente')
          loadProduct() // Recargar los datos del producto
        } catch (error) {
          console.error('Error deactivating product:', error)
          toast.error(error.message || 'Error al desactivar el producto')
        }
      }
    } else {
      // Activar producto
      if (window.confirm('¿Estás seguro de activar este producto?')) {
        try {
          const { inventoryService } = await import('../../services/inventoryService')
          await inventoryService.activateProduct(product.id)
          toast.success('Producto activado exitosamente')
          loadProduct() // Recargar los datos del producto
        } catch (error) {
          console.error('Error activating product:', error)
          toast.error(error.message || 'Error al activar el producto')
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8 mr-3"></div>
        <span className="text-gray-600">Cargando producto...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Producto no encontrado</h3>
        <p className="text-gray-500 mb-4">El producto que buscas no existe o ha sido eliminado.</p>
        <Link to="/inventory" className="btn btn-primary">
          Volver al Inventario
        </Link>
      </div>
    )
  }

  const stockStatus = getStockStatus(product)

  // Para depuración, vamos a mostrar el rol del usuario
  console.log('Usuario actual:', user)
  console.log('Rol del usuario:', user?.role)
  console.log('¿Es administrador?', user?.role === 'ADMIN')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/inventory" 
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalles del Producto</h1>
            <p className="text-sm text-gray-500">
              {product.code} - {product.name}
            </p>
          </div>
        </div>
        {/* Solo mostrar botones si es administrador - SOLUCIÓN EXPLÍCITA */}
        {user && user.role === 'ADMIN' && (
          <div className="flex space-x-3">
            <Link 
              to={`/inventory/edit/${product.id}`} 
              className="btn btn-primary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Producto
            </Link>
            <button
              onClick={handleToggleProductStatus}
              className={`btn ${product.isActive ? 'btn-danger' : 'btn-success'}`}
            >
              {product.isActive ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Desactivar Producto
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Activar Producto
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Imagen y Datos Básicos */}
        <div className="lg:col-span-1 space-y-6">
          {/* Imagen del Producto */}
          <div className="card">
            <div className="card-body">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Datos Básicos */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Referencia</p>
                <p className="text-base font-semibold text-gray-900">{product.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p className="text-base font-semibold text-gray-900">{product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Categoría</p>
                <p className="text-base font-semibold text-gray-900">{product.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Marca</p>
                <p className="text-base font-semibold text-gray-900">{product.brand}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Material</p>
                <p className="text-base font-semibold text-gray-900">{product.material}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Color</p>
                <p className="text-base font-semibold text-gray-900">{product.color}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                  {!product.isActive && (
                    <span className="badge bg-gray-100 text-gray-800">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Detalles y Stock */}
        <div className="lg:col-span-2 space-y-6">
          {/* Precios */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Información de Precios</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Precio de Costo</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(product.purchasePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Precio de Venta</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.salePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Margen de Ganancia</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {((product.salePrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock por Talla */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Stock por Talla</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.stocks.map((stock) => (
                  <div key={stock.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-900">Talla {stock.size}</span>
                      <span className={`badge ${
                        stock.quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : stock.quantity <= product.minStock 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {stock.quantity === 0 
                          ? 'Sin Stock' 
                          : stock.quantity <= product.minStock 
                            ? 'Stock Bajo' 
                            : 'Disponible'
                        }
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Cantidad:</span>
                        <span className="text-sm font-medium">{stock.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Reservado:</span>
                        <span className="text-sm font-medium">{stock.reservedQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Disponible:</span>
                        <span className="text-sm font-medium">{stock.quantity - stock.reservedQuantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Stock Total: {product.totalStock} unidades
                  </span>
                  <span className="text-sm text-blue-600">
                    Stock Mínimo: {product.minStock} unidades
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Descripción</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-700">{product.description}</p>
              </div>
            </div>
          )}

          {/* Información de Auditoría */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Información de Auditoría</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
                    <p className="text-sm text-gray-900">{formatDate(product.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                    <p className="text-sm text-gray-900">{formatDate(product.updatedAt)}</p>
                  </div>
                </div>
              </div>    
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails