import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Building,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useProvidersStore } from '../../store/providersStore'
import { providersService } from '../../services/providersService'
import toast from 'react-hot-toast'

const ProvidersList = () => {
  const { isAdmin } = useAuthStore()
  const {
    fetchProviders,
    getProvidersStats,
    toggleProviderStatus,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    isLoading,
    providers
  } = useProvidersStore()

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedProviders, setSelectedProviders] = useState([])
  const [showInactiveProviders, setShowInactiveProviders] = useState(false)
  const [cities, setCities] = useState([])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadProviders()
    loadCities()
  }, [])

  const loadProviders = async () => {
    try {
      await fetchProviders()
    } catch (error) {
      console.error('Error loading providers:', error)
      toast.error('Error al cargar los proveedores')
    }
  }

  const loadCities = async () => {
    try {
      const citiesData = await providersService.getCities()
      setCities(citiesData)
    } catch (error) {
      console.error('Error loading cities:', error)
    }
  }

  // Filtrar proveedores según el estado seleccionado
  const getFilteredProviders = () => {
    let filtered = [...providers]
    
    // Aplicar filtro por estado
    if (filters.status === 'active') {
      filtered = filtered.filter(provider => provider.isActive)
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(provider => !provider.isActive)
    }
    
    // Aplicar filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.contactName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Aplicar filtro por ciudad
    if (filters.city) {
      filtered = filtered.filter(provider => provider.city === filters.city)
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const filteredProviders = getFilteredProviders()
  const stats = getProvidersStats()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Paginación
  const indexOfLastProvider = currentPage * itemsPerPage
  const indexOfFirstProvider = indexOfLastProvider - itemsPerPage
  const currentProviders = filteredProviders.slice(indexOfFirstProvider, indexOfLastProvider)
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage)

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

  const handleSelectProvider = (providerId) => {
    if (selectedProviders.includes(providerId)) {
      setSelectedProviders(selectedProviders.filter(id => id !== providerId))
    } else {
      setSelectedProviders([...selectedProviders, providerId])
    }
  }

  const handleSelectAll = () => {
    if (selectedProviders.length === currentProviders.length) {
      setSelectedProviders([])
    } else {
      setSelectedProviders(currentProviders.map(provider => provider.id))
    }
  }

  const handleToggleStatus = async (providerId, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar'
    if (window.confirm(`¿Estás seguro de ${action} este proveedor?`)) {
      const result = await toggleProviderStatus(providerId)
      if (result.success) {
        toast.success(`Proveedor ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`)
        loadProviders() // Recargar la lista
      } else {
        toast.error(result.error || `Error al ${action} el proveedor`)
      }
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const clearAllFilters = () => {
    clearFilters()
  }

  // Obtener ciudades únicas para filtros
  const uniqueCities = [...new Set(providers.map(p => p.city).filter(Boolean))].sort()
  
  // Calcular estadísticas adicionales basadas en los datos de proveedores
  const providersWithContactInfo = providers.filter(p => p.email || p.phone).length
  const providersWithPaymentTerms = providers.filter(p => p.paymentTerms || p.paymentDays).length
  const providersWithAddress = providers.filter(p => p.address || p.city).length
  const newProvidersThisMonth = providers.filter(p => {
    const createdDate = new Date(p.createdAt)
    const currentDate = new Date()
    return createdDate.getMonth() === currentDate.getMonth() && 
           createdDate.getFullYear() === currentDate.getFullYear()
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona proveedores y su información de contacto
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {isAdmin() && (
            <Link to="/providers/add" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Proveedor
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProviders}</p>
                <p className="text-xs text-green-600">{stats.activeProviders} activos</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nuevos este mes</p>
                <p className="text-2xl font-bold text-gray-900">{newProvidersThisMonth}</p>
                <p className="text-xs text-gray-500">proveedores registrados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Contacto</p>
                <p className="text-2xl font-bold text-gray-900">{providersWithContactInfo}</p>
                <p className="text-xs text-gray-500">con email o teléfono</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Con Dirección</p>
                <p className="text-2xl font-bold text-gray-900">{providersWithAddress}</p>
                <p className="text-xs text-gray-500">con ubicación registrada</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle for inactive providers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactiveProviders}
              onChange={(e) => setShowInactiveProviders(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">
              Mostrar proveedores inactivos
            </span>
          </label>
        </div>

        {/* Actions for selected providers */}
        {selectedProviders.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedProviders.length} seleccionados
            </span>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, contacto, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <select
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="select w-full"
                  >
                    <option value="">Todas las ciudades</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="select w-full"
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="btn btn-secondary btn-sm"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Providers Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner h-6 w-6 mr-3"></div>
              <span>Cargando proveedores...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedProviders.length === currentProviders.length && currentProviders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th>Proveedor</th>
                    <th>Contacto</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProviders.map((provider) => (
                    <tr key={provider.id} className={!provider.isActive ? 'bg-red-50' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProviders.includes(provider.id)}
                          onChange={() => handleSelectProvider(provider.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td>
                        <div className="flex items-center">
                          <Building className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {provider.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {provider.document}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">
                          {provider.contactName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {provider.phone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {provider.email}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {provider.city}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center">
                          {provider.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`badge ${
                            provider.isActive ? 'badge-success' : 'badge-danger'
                          }`}>
                            {provider.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link
                            to={`/providers/${provider.id}`}
                            className="btn btn-sm btn-secondary"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {isAdmin() && (
                            <>
                              <Link
                                to={`/providers/edit/${provider.id}`}
                                className="btn btn-sm btn-secondary"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(provider.id, provider.isActive)}
                                className={`btn btn-sm ${
                                  provider.isActive 
                                    ? 'btn-warning' 
                                    : 'btn-success'
                                }`}
                                title={provider.isActive ? 'Desactivar' : 'Activar'}
                              >
                                {provider.isActive ? 
                                  <XCircle className="h-4 w-4" /> : 
                                  <CheckCircle className="h-4 w-4" />
                                }
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {currentProviders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'No se encontraron proveedores' 
              : 'No hay proveedores registrados'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || Object.values(filters).some(f => f)
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza registrando tu primer proveedor'
            }
          </p>
          {!searchTerm && !Object.values(filters).some(f => f) && isAdmin() && (
            <Link to="/providers/add" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Proveedor
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {indexOfFirstProvider + 1} a {Math.min(indexOfLastProvider, filteredProviders.length)} de {filteredProviders.length} proveedores
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
    </div>
  )
}

export default ProvidersList