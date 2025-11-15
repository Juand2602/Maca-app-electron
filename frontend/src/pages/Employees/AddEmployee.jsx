import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { ArrowLeft, Save, X, User, Percent } from 'lucide-react' // Agregado Percent
import { useEmployeesStore } from '../../store/employeesStore'
import toast from 'react-hot-toast'

// Componente Combobox reutilizable
const Combobox = ({ value, onChange, options, placeholder, error, disabled }) => {
  const [inputValue, setInputValue] = useState(value || '')
  const [showOptions, setShowOptions] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)

  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  useEffect(() => {
    if (inputValue) {
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [inputValue, options])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setShowOptions(true)
  }

  const handleSelectOption = (option) => {
    setInputValue(option)
    onChange(option)
    setShowOptions(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 200)}
        className={`input ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {showOptions && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onMouseDown={() => handleSelectOption(option)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const AddEmployee = () => {
  const navigate = useNavigate()
  const { addEmployee, isEmailUnique, isDocumentUnique, isLoading } = useEmployeesStore()
  const [cities, setCities] = useState([])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      document: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      phone: '+57 ',
      address: '',
      city: '',
      hireDate: '',
      status: 'ACTIVE',
      commissionRate: 5.0, // NUEVO
      createUser: true
    }
  })

  useEffect(() => {
    const loadCities = async () => {
      try {
        const { providersService } = await import('../../services/providersService')
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
      if (!isDocumentUnique(data.document)) {
        throw new Error('Este documento ya está registrado')
      }

      if (!isEmailUnique(data.email)) {
        throw new Error('Este email ya está registrado')
      }

      // NUEVO: Validar comisión
      if (data.commissionRate < 0 || data.commissionRate > 100) {
        throw new Error('El porcentaje de comisión debe estar entre 0 y 100')
      }

      // NUEVO: Convertir commissionRate a número
      const dataToSend = {
        ...data,
        commissionRate: parseFloat(data.commissionRate)
      }

      const result = await addEmployee(dataToSend)

      if (result.success) {
        toast.success('Empleado agregado exitosamente')
        
        if (result.userCreationError) {
          toast.error(result.userCreationError)
        } else if (data.createUser) {
          toast.success('Usuario de sistema creado exitosamente')
        }
        
        navigate('/employees')
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Error adding employee:', error)
      toast.error(error.message || 'Error al agregar empleado')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/employees" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agregar Empleado</h1>
            <p className="text-sm text-gray-500">
              Completa la información del nuevo empleado
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Empleado
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="1234567890"
                />
                {errors.document && (
                  <p className="mt-1 text-sm text-danger-600">{errors.document.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres *
                </label>
                <input
                  {...register('firstName', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 2,
                      message: 'Mínimo 2 caracteres'
                    }
                  })}
                  type="text"
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="Ingresa los nombres"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-danger-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos *
                </label>
                <input
                  {...register('lastName', {
                    required: 'Los apellidos son requeridos',
                    minLength: {
                      value: 2,
                      message: 'Mínimo 2 caracteres'
                    }
                  })}
                  type="text"
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Ingresa los apellidos"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-danger-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de nacimiento
                </label>
                <input
                  {...register('birthDate')}
                  type="date"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="ejemplo@empresa.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  {...register('phone', {
                    required: 'El teléfono es requerido',
                    pattern: {
                      value: /^\+?57\s?[0-9\s-]{10,}$/,
                      message: 'Formato inválido (ej: +57 300 123 4567)'
                    }
                  })}
                  type="tel"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="+57 300 123 4567"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      options={cities}
                      placeholder="Escribe o selecciona una ciudad"
                      error={errors.city}
                      disabled={false}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de ingreso *
                </label>
                <input
                  {...register('hireDate', {
                    required: 'La fecha de ingreso es requerida'
                  })}
                  type="date"
                  className={`input ${errors.hireDate ? 'input-error' : ''}`}
                />
                {errors.hireDate && (
                  <p className="mt-1 text-sm text-danger-600">{errors.hireDate.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  {...register('address', {
                    required: 'La dirección es requerida'
                  })}
                  type="text"
                  className={`input ${errors.address ? 'input-error' : ''}`}
                  placeholder="Calle 45 #23-56"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-danger-600">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  {...register('status')}
                  className="input"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="VACATION">Vacaciones</option>
                  <option value="SUSPENDED">Suspendido</option>
                </select>
              </div>

              {/* NUEVO: Campo de Comisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="inline h-4 w-4 mr-1" />
                  Porcentaje de Comisión
                </label>
                <input
                  {...register('commissionRate', {
                    required: 'El porcentaje de comisión es requerido',
                    min: {
                      value: 0,
                      message: 'El valor mínimo es 0'
                    },
                    max: {
                      value: 100,
                      message: 'El valor máximo es 100'
                    }
                  })}
                  type="number"
                  step="0.1"
                  className={`input ${errors.commissionRate ? 'input-error' : ''}`}
                  placeholder="5.0"
                />
                {errors.commissionRate && (
                  <p className="mt-1 text-sm text-danger-600">{errors.commissionRate.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: 5 = 5% de comisión por venta
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    {...register('createUser')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Crear usuario de sistema para este empleado
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Se creará un usuario con el email y el documento como contraseña temporal
                </p>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <div className="flex justify-end space-x-4">
              <Link to="/employees" className="btn btn-secondary">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="spinner h-4 w-4 mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Empleado
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddEmployee