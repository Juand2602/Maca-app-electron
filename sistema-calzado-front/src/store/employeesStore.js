import { create } from 'zustand'
import { 
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  changeEmployeeStatus,
  getEmployeesByStatus,
  searchEmployees,
  getAllDepartments,
  getAllPositions,
  getEmployeeStats
} from '../services/employeesService'

export const useEmployeesStore = create((set, get) => ({
  // Estado
  employees: [],
  isLoading: false,
  error: null,
  userCreationError: null, // Nuevo estado para errores de creación de usuario
  searchTerm: '',
  filters: {
    department: '',
    position: '',
    role: '',
    status: '',
    contractType: ''
  },
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    vacation: 0,
    suspended: 0
  },

  // Acciones CRUD
  
  // Obtener todos los empleados
  fetchEmployees: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const employees = await getAllEmployees()
      set({ employees, isLoading: false })
      return employees
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  // Obtener empleado por ID
  getEmployeeById: async (id) => {
    try {
      const employee = await getEmployeeById(id)
      return employee
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  // Agregar empleado
  addEmployee: async (employeeData) => {
    set({ isLoading: true, error: null, userCreationError: null })
    
    try {
      const newEmployee = await createEmployee(employeeData)
      
      // Si se solicitó crear usuario y el empleado se creó correctamente
      if (employeeData.createUser && newEmployee.id) {
        try {
          // Importamos el servicio de auth dinámicamente para evitar dependencias circulares
          const { authService } = await import('../services/authService')
          await authService.createUserForEmployee(newEmployee.id)
          // No mostramos toast aquí, lo manejamos en el componente
        } catch (userError) {
          console.error('Error al crear usuario para el empleado:', userError)
          // Guardamos el error para mostrarlo después
          set({ userCreationError: 'Empleado creado pero hubo un error al crear el usuario de sistema' })
        }
      }
      
      set(state => ({
        employees: [...state.employees, newEmployee],
        isLoading: false
      }))

      return { 
        success: true, 
        employee: newEmployee,
        userCreationError: get().userCreationError
      }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Actualizar empleado
  updateEmployee: async (id, employeeData) => {
    set({ isLoading: true, error: null })
    
    try {
      const updatedEmployee = await updateEmployee(id, employeeData)

      set(state => ({
        employees: state.employees.map(e => 
          e.id === parseInt(id) ? updatedEmployee : e
        ),
        isLoading: false
      }))

      return { success: true, employee: updatedEmployee }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Eliminar empleado
  deleteEmployee: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      await deleteEmployee(id)

      set(state => ({
        employees: state.employees.filter(e => e.id !== parseInt(id)),
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Cambiar estado del empleado
  toggleEmployeeStatus: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const { employees } = get()
      const employee = employees.find(e => e.id === parseInt(id))
      
      if (!employee) {
        throw new Error('Empleado no encontrado')
      }

      const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      await changeEmployeeStatus(id, newStatus)

      set(state => ({
        employees: state.employees.map(e => 
          e.id === parseInt(id) 
            ? { ...e, status: newStatus }
            : e
        ),
        isLoading: false
      }))

      return { success: true, status: newStatus }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Obtener estadísticas de empleados
  fetchEmployeeStats: async () => {
    try {
      const stats = await getEmployeeStats()
      set({ stats })
      return stats
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  // Filtros y búsqueda
  setSearchTerm: (term) => {
    set({ searchTerm: term })
  },

  setFilters: (newFilters) => {
    set(state => ({ 
      filters: { ...state.filters, ...newFilters }
    }))
  },

  clearFilters: () => {
    set({ 
      searchTerm: '',
      filters: {
        department: '',
        position: '',
        role: '',
        status: '',
        contractType: ''
      }
    })
  },

  // Obtener empleados filtrados
  getFilteredEmployees: () => {
    const { employees, searchTerm, filters } = get()
    let filtered = [...employees]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(employee => 
        employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtros adicionales
    if (filters.department) {
      filtered = filtered.filter(employee => employee.department === filters.department)
    }

    if (filters.position) {
      filtered = filtered.filter(employee => employee.position === filters.position)
    }

    if (filters.status) {
      filtered = filtered.filter(employee => employee.status === filters.status)
    }

    if (filters.contractType) {
      filtered = filtered.filter(employee => employee.contractType === filters.contractType)
    }

    return filtered
  },

  // Estadísticas de empleados
  getEmployeesStats: () => {
    const { stats, employees } = get()
    
    // Si ya tenemos estadísticas del backend, las usamos
    if (stats.total > 0) {
      return {
        totalEmployees: stats.total,
        activeEmployees: stats.active,
        inactiveEmployees: stats.inactive,
        vacationEmployees: stats.vacation,
        suspendedEmployees: stats.suspended,
        totalPayroll: employees
          .filter(e => e.status === 'ACTIVE')
          .reduce((sum, e) => sum + (e.salary || 0), 0),
        departmentCount: employees.reduce((acc, e) => {
          if (e.department) {
            acc[e.department] = (acc[e.department] || 0) + 1
          }
          return acc
        }, {}),
        roleCount: {
          'ADMIN': employees.filter(e => e.username).length,
          'EMPLOYEE': employees.filter(e => !e.username).length
        },
        contractTypeCount: employees.reduce((acc, e) => {
          if (e.contractType) {
            acc[e.contractType] = (acc[e.contractType] || 0) + 1
          }
          return acc
        }, {})
      }
    }
    
    // Si no, calculamos estadísticas básicas
    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'ACTIVE').length,
      inactiveEmployees: employees.filter(e => e.status === 'INACTIVE').length,
      vacationEmployees: employees.filter(e => e.status === 'VACATION').length,
      suspendedEmployees: employees.filter(e => e.status === 'SUSPENDED').length,
      totalPayroll: employees
        .filter(e => e.status === 'ACTIVE')
        .reduce((sum, e) => sum + (e.salary || 0), 0),
      departmentCount: employees.reduce((acc, e) => {
        if (e.department) {
          acc[e.department] = (acc[e.department] || 0) + 1
        }
        return acc
      }, {}),
      roleCount: {
        'ADMIN': employees.filter(e => e.username).length,
        'EMPLOYEE': employees.filter(e => !e.username).length
      },
      contractTypeCount: employees.reduce((acc, e) => {
        if (e.contractType) {
          acc[e.contractType] = (acc[e.contractType] || 0) + 1
        }
        return acc
      }, {})
    }
  },

  // Validar email único
  isEmailUnique: (email, excludeId = null) => {
    const { employees } = get()
    return !employees.some(e => 
      e.email && e.email.toLowerCase() === email.toLowerCase() && 
      e.id !== excludeId
    )
  },

  // Validar número de documento único
  isDocumentUnique: (document, excludeId = null) => {
    const { employees } = get()
    return !employees.some(e => 
      e.document === document && 
      e.id !== excludeId
    )
  },

  // Obtener empleados por departamento
  getEmployeesByDepartment: (department) => {
    const { employees } = get()
    return employees.filter(e => e.department === department && e.status === 'ACTIVE')
  },

  // Obtener empleados por rol
  getEmployeesByRole: (role) => {
    const { employees } = get()
    return employees.filter(e => 
      (role === 'ADMIN' ? e.username : !e.username) && 
      e.status === 'ACTIVE'
    )
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null, userCreationError: null })
  }
}))