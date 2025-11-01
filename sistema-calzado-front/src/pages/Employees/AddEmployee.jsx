import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  Heart
} from 'lucide-react'
import { useEmployeesStore } from '../../store/employeesStore'
import toast from 'react-hot-toast'

const AddEmployee = () => {
  const navigate = useNavigate()
  const { addEmployee, isEmailUnique, isDocumentUnique, isLoading } = useEmployeesStore()

  const [formData, setFormData] = useState({
    document: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    address: '',
    city: '',
    phone: '+57 ',
    email: '',
    position: '',
    hireDate: '',
    salary: '',
    workSchedule: '',
    contractType: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    status: 'ACTIVE',
    notes: '',
    createUser: true // Nuevo campo para crear usuario automáticamente
  })

  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState('personal')
  const [cities, setCities] = useState([])

  // Opciones para los select
  const departments = [
    'Ventas',
    'Administración', 
    'Logística',
    'Contabilidad',
    'Recursos Humanos'
  ]

  const positions = [
    'Vendedor',
    'Vendedora Senior',
    'Cajero',
    'Encargado de Inventario',
    'Asistente Administrativo',
    'Contador',
    'Gerente',
    'Supervisor'
  ]

  const relationships = [
    'Padre',
    'Madre',
    'Esposo',
    'Esposa',
    'Hermano',
    'Hermana',
    'Hijo',
    'Hija',
    'Otro'
  ]

  const workSchedules = [
    'Lunes a Viernes - 8:00 AM a 6:00 PM',
    'Lunes a Viernes - 9:00 AM a 5:00 PM',
    'Lunes a Sábado - 8:00 AM a 1:00 PM',
    'Lunes a Viernes - 7:00 AM a 4:00 PM',
    'Lunes a Viernes - 10:00 AM a 7:00 PM',
    'Turno Rotativo (Mañana/Tarde)',
    'Fin de Semana - Sábado y Domingo',
    'Personalizado'
  ]

  // Cargar ciudades desde el backend
  useState(() => {
    const loadCities = async () => {
      try {
        // Usamos el mismo servicio que en AddProvider
        const { providersService } = await import('../../services/providersService')
        const citiesData = await providersService.getCities()
        setCities(citiesData)
      } catch (error) {
        console.error('Error loading cities:', error)
        // Si falla, usamos una lista por defecto
        setCities([
          'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
          'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué',
          'Manizales', 'Villavicencio', 'Neiva', 'Armenia', 'Valledupar',
          'Montería', 'Sincelejo', 'Popayán', 'Pasto', 'Riohacha'
        ])
      }
    }

    loadCities()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validatePersonalInfo = () => {
    const newErrors = {}

    // Validaciones de información personal
    if (!formData.document.trim()) {
      newErrors.document = 'El documento es requerido'
    } else if (!isDocumentUnique(formData.document)) {
      newErrors.document = 'Este documento ya está registrado'
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    } else if (!isEmailUnique(formData.email)) {
      newErrors.email = 'Este email ya está registrado'
    }

    if (!formData.phone.trim() || formData.phone.trim() === '+57') {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\+?57\s?[0-9\s-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Formato de teléfono no válido (ej: +57 300 123 4567)'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateJobInfo = () => {
    const newErrors = {}

    // Validaciones laborales
    if (!formData.position.trim()) {
      newErrors.position = 'El cargo es requerido'
    }

    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es requerido'
    }

    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = 'El salario debe ser mayor a 0'
    }

    if (!formData.hireDate) {
      newErrors.hireDate = 'La fecha de ingreso es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateEmergencyInfo = () => {
    const newErrors = {}

    // Validaciones de contacto de emergencia
    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'El nombre del contacto de emergencia es requerido'
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'El teléfono del contacto de emergencia es requerido'
    }

    if (!formData.emergencyContactRelationship.trim()) {
      newErrors.emergencyContactRelationship = 'El parentesco es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = () => {
    const personalValid = validatePersonalInfo()
    const jobValid = validateJobInfo()
    const emergencyValid = validateEmergencyInfo()
    
    return personalValid && jobValid && emergencyValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario')
      return
    }

    const result = await addEmployee({
      ...formData,
      salary: parseFloat(formData.salary)
    })

    if (result.success) {
      toast.success('Empleado agregado exitosamente')
      
      // Mostrar mensaje de error si hubo un problema al crear el usuario
      if (result.userCreationError) {
        toast.error(result.userCreationError)
      } else if (formData.createUser) {
        toast.success('Usuario de sistema creado exitosamente')
      }
      
      navigate('/employees')
    } else {
      toast.error(result.error || 'Error al agregar empleado')
    }
  }

  const tabs = [
    { id: 'personal', name: 'Información Personal', icon: User },
    { id: 'job', name: 'Información Laboral', icon: Briefcase },
    { id: 'emergency', name: 'Contacto de Emergencia', icon: Heart }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/employees"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Volver a empleados
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Empleado</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="card">
        <div className="card-body p-0">
          <nav className="flex space-x-8 px-6 py-4 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body">
            
            {/* Información Personal */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información Personal
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento *
                    </label>
                    <input
                      type="text"
                      name="document"
                      value={formData.document}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.document ? 'input-error' : ''}`}
                      placeholder="1234567890"
                    />
                    {errors.document && (
                      <p className="mt-1 text-sm text-red-600">{errors.document}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.firstName ? 'input-error' : ''}`}
                      placeholder="Ingresa los nombres"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.lastName ? 'input-error' : ''}`}
                      placeholder="Ingresa los apellidos"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado civil
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="Soltero">Soltero</option>
                      <option value="Casado">Casado</option>
                      <option value="Divorciado">Divorciado</option>
                      <option value="Viudo">Viudo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.email ? 'input-error' : ''}`}
                      placeholder="ejemplo@empresa.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.phone ? 'input-error' : ''}`}
                      placeholder="+57 300 123 4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`input w-full ${errors.address ? 'input-error' : ''}`}
                    placeholder="Calle 45 #23-56, Bucaramanga"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Información Laboral */}
            {activeTab === 'job' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Briefcase className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información Laboral
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.position ? 'input-error' : ''}`}
                    >
                      <option value="">Selecciona un cargo</option>
                      {positions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                    {errors.position && (
                      <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento de trabajo *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.department ? 'input-error' : ''}`}
                    >
                      <option value="">Selecciona un departamento</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Salario mensual *
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.salary ? 'input-error' : ''}`}
                      placeholder="1200000"
                      min="0"
                    />
                    {errors.salary && (
                      <p className="mt-1 text-sm text-red-600">{errors.salary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Fecha de ingreso *
                    </label>
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.hireDate ? 'input-error' : ''}`}
                    />
                    {errors.hireDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de contrato *
                    </label>
                    <select
                      name="contractType"
                      value={formData.contractType}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Selecciona un tipo</option>
                      <option value="indefinido">Término Indefinido</option>
                      <option value="temporal">Término Fijo</option>
                      <option value="prestacion">Prestación de Servicios</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario de trabajo
                    </label>
                    <select
                      name="workSchedule"
                      value={formData.workSchedule}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Selecciona un horario</option>
                      {workSchedules.map(schedule => (
                        <option key={schedule} value={schedule}>{schedule}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                      <option value="VACATION">Vacaciones</option>
                      <option value="SUSPENDED">Suspendido</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="createUser"
                        checked={formData.createUser}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Crear usuario de sistema para este empleado
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Se creará un usuario con el email y un documento como contraseña temporal
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="input w-full"
                    placeholder="Información adicional sobre el empleado"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Contacto de Emergencia */}
            {activeTab === 'emergency' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Heart className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contacto de Emergencia
                  </h3>
                  <p className="text-sm text-gray-500 ml-4">
                    Persona a contactar en caso de emergencia
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.emergencyContactName ? 'input-error' : ''}`}
                      placeholder="Nombre del contacto de emergencia"
                    />
                    {errors.emergencyContactName && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parentesco *
                    </label>
                    <select
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.emergencyContactRelationship ? 'input-error' : ''}`}
                    >
                      <option value="">Selecciona el parentesco</option>
                      {relationships.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                    {errors.emergencyContactRelationship && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      className={`input w-full ${errors.emergencyContactPhone ? 'input-error' : ''}`}
                      placeholder="+57 300 987 6543"
                    />
                    {errors.emergencyContactPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Form Actions */}
          <div className="card-footer">
            <div className="flex justify-between">
              <Link
                to="/employees"
                className="btn btn-secondary"
              >
                Cancelar
              </Link>
              
              <div className="flex space-x-3">
                {/* Navigation buttons */}
                {activeTab !== 'personal' && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1].id)
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    Anterior
                  </button>
                )}
                
                {activeTab !== 'emergency' ? (
                  <button
                    type="button"
                    onClick={() => {
                      let isValid = false
                      
                      if (activeTab === 'personal') {
                        isValid = validatePersonalInfo()
                      } else if (activeTab === 'job') {
                        isValid = validateJobInfo()
                      }
                      
                      if (isValid) {
                        const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1].id)
                        }
                      } else {
                        toast.error('Por favor, corrige los errores en esta sección antes de continuar')
                      }
                    }}
                    className="btn btn-primary"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Empleado
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddEmployee