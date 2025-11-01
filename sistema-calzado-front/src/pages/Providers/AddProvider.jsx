import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, X, Building, User, Phone, Mail, MapPin, CreditCard } from 'lucide-react'
import { useProvidersStore } from '../../store/providersStore'
import { providersService } from '../../services/providersService'
import toast from 'react-hot-toast'

const AddProvider = () => {
  const navigate = useNavigate()
  const { addProvider } = useProvidersStore()
  const [cities, setCities] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      document: '',
      name: '',
      businessName: '',
      contactName: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      paymentTerms: '',
      paymentDays: '',
      notes: ''
    }
  })

  useEffect(() => {
    // Cargar ciudades desde el backend
    const loadCities = async () => {
      try {
        const citiesData = await providersService.getCities()
        setCities(citiesData)
      } catch (error) {
        console.error('Error loading cities:', error)
      }
    }

    loadCities()
  }, [])

  const onSubmit = async (data) => {
    try {
      // Validaciones adicionales
      if (!data.name.trim()) {
        throw new Error('El nombre del proveedor es requerido')
      }

      if (!data.document.trim()) {
        throw new Error('El documento del proveedor es requerido')
      }

      // Preparar datos
      const providerData = {
        ...data,
        name: data.name.trim(),
        document: data.document.trim(),
        businessName: data.businessName?.trim() || '',
        contactName: data.contactName?.trim() || '',
        email: data.email?.trim().toLowerCase() || '',
        phone: data.phone?.trim() || '',
        mobile: data.mobile?.trim() || '',
        address: data.address?.trim() || '',
        city: data.city?.trim() || '',
        paymentTerms: data.paymentTerms?.trim() || '',
        paymentDays: data.paymentDays ? parseInt(data.paymentDays) : null,
        notes: data.notes?.trim() || '',
        isActive: true
      }

      // Crear proveedor
      const result = await addProvider(providerData)
      
      if (result.success) {
        toast.success('Proveedor agregado exitosamente')
        navigate('/providers')
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Error adding provider:', error)
      toast.error(error.message || 'Error al agregar el proveedor')
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Agregar Proveedor</h1>
            <p className="text-sm text-gray-500">
              Completa la información del nuevo proveedor
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Información de la Empresa
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento *
                </label>
                <input
                  {...register('document', {
                    required: 'El documento es requerido',
                    minLength: {
                      value: 3,
                      message: 'Mínimo 3 caracteres'
                    }
                  })}
                  type="text"
                  className={`input ${errors.document ? 'input-error' : ''}`}
                  placeholder="Ej: 800123456-7"
                />
                {errors.document && (
                  <p className="mt-1 text-sm text-danger-600">{errors.document.message}</p>
                )}
              </div>

              {/* Nombre de la empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  {...register('name', {
                    required: 'El nombre de la empresa es requerido',
                    minLength: {
                      value: 3,
                      message: 'Mínimo 3 caracteres'
                    }
                  })}
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Ej: Calzados Premium S.A.S"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
                )}
              </div>

              {/* Razón Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social
                </label>
                <input
                  {...register('businessName')}
                  type="text"
                  className="input"
                  placeholder="Ej: Calzados Premium S.A.S"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Corporativo
                </label>
                <input
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="ventas@empresa.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información de Contacto
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Persona de contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de Contacto
                </label>
                <input
                  {...register('contactName')}
                  type="text"
                  className="input"
                  placeholder="Nombre del contacto principal"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Formato de teléfono inválido'
                    }
                  })}
                  type="tel"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="6012345678"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Celular
                </label>
                <input
                  {...register('mobile', {
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Formato de celular inválido'
                    }
                  })}
                  type="tel"
                  className={`input ${errors.mobile ? 'input-error' : ''}`}
                  placeholder="3001234567"
                />
                {errors.mobile && (
                  <p className="mt-1 text-sm text-danger-600">{errors.mobile.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Ubicación
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  {...register('address')}
                  type="text"
                  className="input"
                  placeholder="Carrera 15 #45-67"
                />
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <select
                  {...register('city')}
                  className="select"
                >
                  <option value="">Seleccionar ciudad</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Pago */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Información de Pago
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Términos de pago */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos de Pago
                </label>
                <textarea
                  {...register('paymentTerms')}
                  rows={3}
                  className="input"
                  placeholder="Ej: Pago a 30 días, 50% anticipo, etc."
                />
              </div>

              {/* Días de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Pago
                </label>
                <input
                  {...register('paymentDays', {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: 'El valor debe ser mayor o igual a 0'
                    }
                  })}
                  type="number"
                  className={`input ${errors.paymentDays ? 'input-error' : ''}`}
                  placeholder="30"
                />
                {errors.paymentDays && (
                  <p className="mt-1 text-sm text-danger-600">{errors.paymentDays.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Notas</h3>
          </div>
          <div className="card-body">
            <textarea
              {...register('notes')}
              rows={4}
              className="input"
              placeholder="Información adicional sobre el proveedor..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            to="/providers"
            className="btn btn-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Proveedor
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProvider