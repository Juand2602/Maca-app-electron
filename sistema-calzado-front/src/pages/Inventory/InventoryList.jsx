import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Package,
  Eye
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import useInventoryStore from '../../store/inventoryStore'
import toast from 'react-hot-toast'

const InventoryList = () => {
  const { isAdmin } = useAuthStore()
  const inventoryStore = useInventoryStore()
  
  // Extraer las funciones del store
  const {
    fetchProducts,
    getInventoryStats,
    deleteProduct,
    activateProduct,
    deleteMultipleProducts,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    isLoading
  } = inventoryStore

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  })

  // Obtener datos del store
  const filteredProducts = inventoryStore.getFilteredProducts()

  useEffect(() => {
    // Cargar productos al montar el componente
    loadProducts()
    loadStats()
  }, [])

  const loadProducts = async () => {
    const result = await fetchProducts()
    if (!result.success) {
      toast.error(result.error || 'Error al cargar los productos')
    }
  }

  const loadStats = async () => {
    const inventoryStats = await getInventoryStats()
    setStats(inventoryStats)
  }

  useEffect(() => {
    // Limpiar selección cuando cambien los filtros
    setSelectedProducts([])
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Paginación
  const indexOfLastProduct = currentPage * itemsPerPage
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
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

  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(currentProducts.map(product => product.id))
    }
  }

  const handleToggleProductStatus = async (productId) => {
    const product = inventoryStore.products.find(p => p.id === productId)
    const isActive = product?.isActive
    
    if (isActive) {
      // Desactivar producto
      if (window.confirm('¿Estás seguro de desactivar este producto?')) {
        const result = await deleteProduct(productId)
        if (result.success) {
          toast.success('Producto desactivado exitosamente')
          loadStats() // Actualizar estadísticas
        } else {
          toast.error(result.error || 'Error al desactivar el producto')
        }
      }
    } else {
      // Activar producto
      if (window.confirm('¿Estás seguro de activar este producto?')) {
        const result = await activateProduct(productId)
        if (result.success) {
          toast.success('Producto activado exitosamente')
          loadStats() // Actualizar estadísticas
        } else {
          toast.error(result.error || 'Error al activar el producto')
        }
      }
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de desactivar este producto?')) {
      const result = await deleteProduct(productId)
      if (result.success) {
        toast.success('Producto desactivado exitosamente')
        loadStats() // Actualizar estadísticas
      } else {
        toast.error(result.error || 'Error al desactivar el producto')
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    
    if (window.confirm(`¿Estás seguro de desactivar ${selectedProducts.length} productos?`)) {
      const result = await deleteMultipleProducts(selectedProducts)
      if (result.success) {
        setSelectedProducts([])
        toast.success(`${result.deletedCount} productos desactivados exitosamente`)
        loadStats() // Actualizar estadísticas
      } else {
        toast.error(result.error || 'Error al desactivar productos')
      }
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const clearAllFilters = () => {
    clearFilters()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los productos de tu inventario
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isAdmin() && (
            <Link to="/inventory/add" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sin Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockProducts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Valor Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.totalValue)}
                </p>
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
                placeholder="Buscar productos..."
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
              {(searchTerm || Object.values(filters).some(f => f)) && (
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="select"
                  >
                    <option value="">Todas</option>
                    <option value="Formal">Formal</option>
                    <option value="Casual">Casual</option>
                    <option value="Deportivo">Deportivo</option>
                    <option value="Botas">Botas</option>
                    <option value="Sandalias">Sandalias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={filters.color}
                    onChange={(e) => handleFilterChange('color', e.target.value)}
                    className="select"
                  >
                    <option value="">Todos</option>
                    <option value="Negro">Negro</option>
                    <option value="Marrón">Marrón</option>
                    <option value="Blanco">Blanco</option>
                    <option value="Beige">Beige</option>
                    <option value="Gris">Gris</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado de Stock
                  </label>
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                    className="select"
                  >
                    <option value="">Todos</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del Producto
                  </label>
                  <select
                    value={filters.productStatus}
                    onChange={(e) => handleFilterChange('productStatus', e.target.value)}
                    className="select"
                  >
                    <option value="">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedProducts.length} productos seleccionados
            </span>
            <div className="space-x-2">
              {isAdmin() && (
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-sm btn-danger"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Desactivar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner h-6 w-6 mr-3"></div>
              <span>Procesando...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th>Referencia</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Total</th>
                    <th>Estado</th>
                    <th>Precio Venta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <tr key={product.id} className={product.isActive ? '' : 'opacity-60'}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="font-mono text-sm font-medium">
                          {product.code}
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              {product.material} - {product.color}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-secondary">
                            {product.category}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium">{product.totalStock}</span>
                          <span className="text-sm text-gray-500 ml-1">
                            (min: {product.minStock})
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                          {!product.isActive && (
                            <span className="ml-2 badge bg-gray-100 text-gray-800">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="font-medium">
                          {formatCurrency(product.salePrice)}
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <Link
                              to={`/inventory/details/${product.id}`}
                              className="btn btn-sm btn-secondary"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {isAdmin() && (
                              <Link
                                to={`/inventory/edit/${product.id}`}
                                className="btn btn-sm btn-secondary"
                                title="Editar producto"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            )}
                            {isAdmin() && (
                              <button
                                onClick={() => handleToggleProductStatus(product.id)}
                                className={`btn btn-sm ${product.isActive ? 'btn-danger' : 'btn-success'}`}
                                disabled={isLoading}
                                title={product.isActive ? "Desactivar producto" : "Activar producto"}
                              >
                                {product.isActive ? (
                                  <Trash2 className="h-4 w-4" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
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
            Mostrando {indexOfFirstProduct + 1} a {Math.min(indexOfLastProduct, filteredProducts.length)} de {filteredProducts.length} productos
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
      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'No se encontraron productos' 
              : 'No hay productos en el inventario'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || Object.values(filters).some(f => f)
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer producto'
            }
          </p>
          {isAdmin() && !searchTerm && !Object.values(filters).some(f => f) && (
            <Link to="/inventory/add" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Producto
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default InventoryList