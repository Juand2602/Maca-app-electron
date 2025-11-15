// src/pages/Auth/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom' 
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, User, Lock, Warehouse } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error } = useAuthStore()
  
  const navigate = useNavigate() 
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
      warehouse: 'San Francisco',
    }
  })

  const onSubmit = async (data) => {
    const { username, password, warehouse } = data
    
    const result = await login({ username, password, warehouse })
    
    if (result.success) {
      toast.success('¡Inicio de sesión exitoso!')
      navigate('/') 
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-maca.png" 
              alt="MACA Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sistema Administrativo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', {
                    required: 'El usuario es requerido',
                    minLength: {
                      value: 3,
                      message: 'El usuario debe tener al menos 3 caracteres'
                    }
                  })}
                  type="text"
                  className={`input pl-10 ${errors.username ? 'input-error' : ''}`}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-danger-600">{errors.username.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 4,
                      message: 'La contraseña debe tener al menos 4 caracteres'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
              )}
            </div>

            {/* Bodega - Selector */}
            <div>
              <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-2">
                Bodega
              </label>
              <select
                {...register('warehouse', {
                  required: 'La bodega es requerida'
                })}
                className={`input ${errors.warehouse ? 'input-error' : ''}`}
              >
                <option value="San Francisco">San Francisco</option>
                <option value="Centro">Centro</option>
              </select>
              {errors.warehouse && (
                <p className="mt-1 text-sm text-danger-600">{errors.warehouse.message}</p>
              )}
            </div>

            {/* Error general */}
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-md p-3">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn btn-primary w-full py-3 text-base ${isLoading ? 'btn-disabled' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-5 w-5 mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'INGRESAR'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm font-semibold text-black">MACA</p>
          <p className="text-xs text-gray-500 mt-1">
            Sistema de Gestión para Empresa de Calzado
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login