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
  User,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  Trash2
} from 'lucide-react'
import { useEmployeesStore } from '../../store/employeesStore'
import toast from 'react-hot-toast'

const EmployeesList = () => {
  const {
    employees,
    fetchEmployees,
    fetchEmployeeStats,
    deleteEmployee,
    toggleEmployeeStatus,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters,
    isLoading,
    error
  } = useEmployeesStore()

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchEmployees(),
          fetchEmployeeStats()
        ])
        setDataLoaded(true)
      } catch (error) {
        toast.error('Error al cargar los datos de empleados')
      }
    }

    if (!dataLoaded) {
      loadData()
    }
  }, [fetchEmployees, fetchEmployeeStats, dataLoaded])

  // Obtener datos del store
  const filteredEmployees = useEmployeesStore(state => state.getFilteredEmployees())
  const stats = useEmployeesStore(state => state.getEmployeesStats())

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Paginación
  const indexOfLastEmployee = currentPage * itemsPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateYearsOfService = (hireDate) => {
    if (!hireDate) return 0;
    const years = (new Date() - new Date(hireDate)) / (365.25 * 24 * 60 * 60 * 1000)
    return Math.floor(years)
  }

  const handleSelectEmployee = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId))
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId])
    }
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === currentEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(currentEmployees.map(employee => employee.id))
    }
  }

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.')) {
      const result = await deleteEmployee(employeeId)
      if (result.success) {
        toast.success('Empleado eliminado exitosamente')
      } else {
        toast.error(result.error || 'Error al eliminar el empleado')
      }
    }
  }

  const handleToggleStatus = async (employeeId, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'desactivar' : 'activar'
    if (window.confirm(`¿Estás seguro de ${action} este empleado?`)) {
      const result = await toggleEmployeeStatus(employeeId)
      if (result.success) {
        toast.success(`Empleado ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`)
      } else {
        toast.error(result.error || `Error al ${action} el empleado`)
      }
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const clearAllFilters = () => {
    clearFilters()
  }

  // Obtener datos únicos para filtros
  const uniqueDepartments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort()
  const uniquePositions = [...new Set(employees.map(e => e.position).filter(Boolean))].sort()

  if (!dataLoaded) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona empleados, roles y permisos del sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/employees/add" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Empleado
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                <p className="text-xs text-green-600">{stats.activeEmployees} activos</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nómina Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalPayroll)}
                </p>
                <p className="text-xs text-gray-500">mensual</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Departamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(stats.departmentCount).length}
                </p>
                <p className="text-xs text-gray-500">áreas de trabajo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.roleCount.ADMIN}</p>
                <p className="text-xs text-gray-500">{stats.roleCount.EMPLOYEE} empleados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle for inactive employees */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactiveEmployees}
              onChange={(e) => setShowInactiveEmployees(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">
              Mostrar empleados inactivos
            </span>
          </label>
        </div>

        {/* Actions for selected employees */}
        {selectedEmployees.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedEmployees.length} seleccionados
            </span>
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar los empleados seleccionados?')) {
                  selectedEmployees.forEach(id => handleDeleteEmployee(id))
                  setSelectedEmployees([])
                }
              }}
              className="btn btn-sm btn-danger"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </button>
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
                  placeholder="Buscar por nombre, email, teléfono, cargo..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <select
                    value={filters.department || ''}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="select w-full"
                  >
                    <option value="">Todos los departamentos</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <select
                    value={filters.position || ''}
                    onChange={(e) => handleFilterChange('position', e.target.value)}
                    className="select w-full"
                  >
                    <option value="">Todos los cargos</option>
                    {uniquePositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
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
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="VACATION">Vacaciones</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Contrato
                  </label>
                  <select
                    value={filters.contractType || ''}
                    onChange={(e) => handleFilterChange('contractType', e.target.value)}
                    className="select w-full"
                  >
                    <option value="">Todos los contratos</option>
                    <option value="indefinido">Indefinido</option>
                    <option value="temporal">Temporal</option>
                    <option value="prestacion">Prestación de servicios</option>
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

      {/* Employees Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner h-6 w-6 mr-3"></div>
              <span>Cargando empleados...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === currentEmployees.length && currentEmployees.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th>Empleado</th>
                    <th>Contacto</th>
                    <th>Cargo</th>
                    <th>Salario</th>
                    <th>Contrato</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees
                    .filter(employee => showInactiveEmployees || employee.status === 'ACTIVE' || employee.status === 'VACATION' || employee.status === 'SUSPENDED')
                    .map((employee) => {
                      const yearsOfService = calculateYearsOfService(employee.hireDate)
                      
                      return (
                        <tr key={employee.id} className={employee.status === 'INACTIVE' ? 'bg-red-50' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => handleSelectEmployee(employee.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td>
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.firstName} {employee.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {employee.id}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center mt-1">
                                  {employee.username ? (
                                    <Shield className="h-3 w-3 mr-1 text-orange-500" />
                                  ) : (
                                    <User className="h-3 w-3 mr-1 text-gray-400" />
                                  )}
                                  {employee.username ? 'Administrador' : 'Empleado'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-gray-900 flex items-center mb-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.email || 'No especificado'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mb-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {employee.phone || 'No especificado'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {employee.city || 'No especificada'}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.position || 'No especificado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.department || 'No especificado'}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              {yearsOfService} {yearsOfService === 1 ? 'año' : 'años'} de servicio
                            </div>
                          </td>
                          <td className="font-medium text-gray-900">
                            <div>
                              {formatCurrency(employee.salary)}
                            </div>
                            <div className="text-xs text-gray-500">
                              mensual
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-gray-900">
                              {employee.contractType || 'No especificado'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Desde: {formatDate(employee.hireDate)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {employee.document}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center">
                              {employee.status === 'ACTIVE' ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              ) : employee.status === 'INACTIVE' ? (
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              ) : employee.status === 'VACATION' ? (
                                <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 text-orange-500 mr-1" />
                              )}
                              <span className={`badge ${
                                employee.status === 'ACTIVE' ? 'badge-success' : 
                                employee.status === 'INACTIVE' ? 'badge-danger' :
                                employee.status === 'VACATION' ? 'badge-info' :
                                'badge-warning'
                              }`}>
                                {employee.status === 'ACTIVE' ? 'Activo' : 
                                 employee.status === 'INACTIVE' ? 'Inactivo' :
                                 employee.status === 'VACATION' ? 'Vacaciones' :
                                 'Suspendido'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <Link
                                to={`/employees/details/${employee.id}`}
                                className="btn btn-sm btn-secondary"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                to={`/employees/edit/${employee.id}`}
                                className="btn btn-sm btn-secondary"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(employee.id, employee.status)}
                                className={`btn btn-sm ${
                                  employee.status === 'ACTIVE' 
                                    ? 'btn-warning' 
                                    : 'btn-success'
                                }`}
                                title={employee.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                              >
                                {employee.status === 'ACTIVE' ? 
                                  <UserX className="h-4 w-4" /> : 
                                  <UserCheck className="h-4 w-4" />
                                }
                              </button>
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

      {/* Empty State */}
      {currentEmployees.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'No se encontraron empleados' 
              : 'No hay empleados registrados'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || Object.values(filters).some(f => f)
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza registrando tu primer empleado'
            }
          </p>
          {!searchTerm && !Object.values(filters).some(f => f) && (
            <Link to="/employees/add" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empleado
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {indexOfFirstEmployee + 1} a {Math.min(indexOfLastEmployee, filteredEmployees.length)} de {filteredEmployees.length} empleados
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

export default EmployeesList