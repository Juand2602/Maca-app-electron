import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { ArrowLeft, Save, X, User, Package, Percent } from 'lucide-react'
import { useEmployeesStore } from '../../store/employeesStore'
import toast from 'react-hot-toast'

// NUEVO: Función para formatear fecha a YYYY-MM-DD
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

const EditEmployee = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { 
    getEmployeeById, 
    updateEmployee, 
    isEmailUnique, 
    isDocumentUnique, 
    isLoading 
  } = useEmployeesStore()

  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState([])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

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

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const employeeData = await getEmployeeById(id)
        if (employeeData) {
          setEmployee(employeeData)
          reset({
            document: employeeData.document || '',
            firstName: employeeData.firstName || '',
            lastName: employeeData.lastName || '',
            birthDate: formatDateForInput(employeeData.birthDate), // CORREGIDO
            email: employeeData.email || '',
            phone: employeeData.phone || '+57 ',
            address: employeeData.address || '',
            city: employeeData.city || '',
            hireDate: formatDateForInput(employeeData.hireDate), // CORREGIDO
            status: employeeData.status || 'ACTIVE',
            commissionRate: employeeData.commissionRate || 5.0
          })
          setLoading(false)
        } else {
          toast.error('Empleado no encontrado')
          navigate('/employees')
        }
      } catch (error) {
        toast.error('Error al cargar los datos del empleado')
        navigate('/employees')
      }
    }

    loadEmployee()
  }, [id, getEmployeeById, navigate, reset])

  const onSubmit = async (data) => {
    try {
      if (!isDocumentUnique(data.document, parseInt(id))) {
        throw new Error('Este documento ya está registrado')
      }

      if (!isEmailUnique(data.email, parseInt(id))) {
        throw new Error('Este email ya está registrado')
      }

      // Validar comisión
      if (data.commissionRate < 0 || data.commissionRate > 100) {
        throw new Error('El porcentaje de comisión debe estar entre 0 y 100')
      }

      // Convertir commissionRate a número
      const dataToSend = {
        ...data,
        commissionRate: parseFloat(data.commissionRate)
      }

      const result = await updateEmployee(id, dataToSend)

      if (result.success) {
        toast.success('Empleado actualizado exitosamente')
        navigate('/employees')
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error(error.message || 'Error al actualizar empleado')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8 mr-3"></div>
        <span className="text-gray-600">Cargando empleado...</span>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Empleado no encontrado</h3>
        <p className="text-gray-500 mb-4">El empleado que buscas no existe o ha sido eliminado.</p>
        <Link to="/employees" className="btn btn-primary">
          Volver a Empleados
        </Link>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">Editar Empleado</h1>
            <p className="text-sm text-gray-500">
              {employee.firstName} {employee.lastName}
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
                    Actualizando...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Actualizar Empleado
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

export default EditEmployee