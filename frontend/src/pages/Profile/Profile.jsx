// src/pages/Profile/Profile.jsx
import { User, Mail, Building2, Shield, Calendar, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'No disponible';
    }
  }

  const handleGoBack = () => {
    navigate('/') // CORREGIDO: navega al dashboard principal
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Información de tu cuenta
          </p>
        </div>
        <button
          onClick={handleGoBack}
          className="btn btn-secondary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center mb-6 pb-6 border-b border-gray-200">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-10 w-10 text-primary-600" />
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                <span className="capitalize">{user.role?.toLowerCase()}</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Nombre de usuario</p>
                <p className="text-base text-gray-900 mt-1">{user.username}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Correo electrónico</p>
                <p className="text-base text-gray-900 mt-1">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Bodega</p>
                <p className="text-base text-gray-900 mt-1">{user.warehouse || 'San Francisco'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Rol del sistema</p>
                <p className="text-base text-gray-900 mt-1 capitalize">
                  {user.role === 'ADMIN' ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start md:col-span-2">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Último inicio de sesión</p>
                <p className="text-base text-gray-900 mt-1">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'No disponible'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile