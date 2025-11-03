import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  User,
  FileText,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useProvidersStore } from '../../store/providersStore'
import { providersService } from '../../services/providersService'
import toast from 'react-hot-toast'

const ProviderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { 
    getProviderById, 
    toggleProviderStatus
  } = useProvidersStore()
  
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProvider()
  }, [id])

  const loadProvider = async () => {
    setLoading(true)
    try {
      const providerData = await providersService.getProviderById(id)
      setProvider(providerData)
    } catch (error) {
      console.error('Error loading provider:', error)
      toast.error('Error al cargar el proveedor')
      navigate('/providers')
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleToggleStatus = async () => {
    const action = provider.isActive ? 'desactivar' : 'activar'
    if (window.confirm(`¿Estás seguro de ${action} este proveedor?`)) {
      try {
        if (provider.isActive) {
          await providersService.deleteProvider(id)
        } else {
          await providersService.activateProvider(id)
        }
        
        // Recargar datos
        loadProvider()
        toast.success(`Proveedor ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`)
      } catch (error) {
        toast.error(error.response?.data?.error || `Error al ${action} el proveedor`)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8 mr-3"></div>
        <span className="text-gray-600">Cargando proveedor...</span>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Proveedor no encontrado</h3>
        <p className="text-gray-500 mb-4">El proveedor que buscas no existe o ha sido eliminado.</p>
        <Link to="/providers" className="btn btn-primary">
          Volver a Proveedores
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/providers" 
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {provider.name}
            </h1>
            <p className="text-sm text-gray-500">
              {provider.businessName}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {isAdmin() && (
            <>
              <Link
                to={`/providers/edit/${id}`}
                className="btn btn-secondary"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
              <button
                onClick={handleToggleStatus}
                className={`btn ${
                  provider.isActive ? 'btn-warning' : 'btn-success'
                }`}
              >
                {provider.isActive ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center">
        {provider.isActive ? (
          <span className="badge badge-success flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Activo
          </span>
        ) : (
          <span className="badge badge-secondary flex items-center">
            <XCircle className="h-4 w-4 mr-1" />
            Inactivo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Información de la Empresa
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Documento</h4>
                  <p className="mt-1 text-sm text-gray-900">{provider.document}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nombre de la Empresa</h4>
                  <p className="mt-1 text-sm text-gray-900">{provider.name}</p>
                </div>
                {provider.businessName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Razón Social</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.businessName}</p>
                  </div>
                )}
                {provider.contactName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Persona de Contacto</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.contactName}</p>
                  </div>
                )}
                {provider.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.email}</p>
                  </div>
                )}
                {provider.phone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Teléfono</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.phone}</p>
                  </div>
                )}
                {provider.mobile && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Celular</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.mobile}</p>
                  </div>
                )}
                {provider.paymentTerms && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Términos de Pago</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.paymentTerms}</p>
                  </div>
                )}
                {provider.paymentDays && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Días de Pago</h4>
                    <p className="mt-1 text-sm text-gray-900">{provider.paymentDays} días</p>
                  </div>
                )}
              </div>
              {provider.address && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Dirección</h4>
                  <p className="mt-1 text-sm text-gray-900">{provider.address}</p>
                  {provider.city && (
                    <p className="mt-1 text-sm text-gray-900">
                      {provider.city}
                    </p>
                  )}
                </div>
              )}
              {provider.notes && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Notas</h4>
                  <p className="mt-1 text-sm text-gray-900">{provider.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar with Provider Info */}
        <div className="space-y-6">
          {/* Provider Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Información</h3>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Creado:</span>
                <p className="text-gray-900">
                  {formatDate(provider.createdAt)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Estado:</span>
                <p>
                  <span className={`badge ${
                    provider.isActive ? 'badge-success' : 'badge-secondary'
                  }`}>
                    {provider.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>
              {provider.updatedAt && (
                <div>
                  <span className="font-medium text-gray-600">Última actualización:</span>
                  <p className="text-gray-900">
                    {formatDate(provider.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderDetails