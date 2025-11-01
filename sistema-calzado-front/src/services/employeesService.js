import api from './api';

// Obtener todos los empleados
export const getAllEmployees = async () => {
  try {
    const response = await api.get('/employees');
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    throw error;
  }
};

// Obtener empleados con paginación
export const getEmployeesPaginated = async (page = 0, size = 10, sort = 'id,asc') => {
  try {
    const response = await api.get(`/employees/paginated?page=${page}&size=${size}&sort=${sort}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados paginados:', error);
    throw error;
  }
};

// Obtener empleado por ID
export const getEmployeeById = async (id) => {
  try {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    throw error;
  }
};

// Obtener empleado por documento
export const getEmployeeByDocument = async (document) => {
  try {
    const response = await api.get(`/employees/document/${document}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleado por documento:', error);
    throw error;
  }
};

// Crear nuevo empleado
export const createEmployee = async (employeeData) => {
  try {
    const response = await api.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    console.error('Error al crear empleado:', error);
    throw error;
  }
};

// Actualizar empleado
export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    throw error;
  }
};

// Eliminar (desactivar) empleado
export const deleteEmployee = async (id) => {
  try {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    throw error;
  }
};

// Cambiar estado del empleado
export const changeEmployeeStatus = async (id, status) => {
  try {
    const response = await api.patch(`/employees/${id}/status?status=${status}`);
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado del empleado:', error);
    throw error;
  }
};

// Obtener empleados por estado
export const getEmployeesByStatus = async (status) => {
  try {
    const response = await api.get(`/employees/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener empleados por estado:', error);
    throw error;
  }
};

// Buscar empleados
export const searchEmployees = async (query) => {
  try {
    const response = await api.get(`/employees/search?q=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar empleados:', error);
    throw error;
  }
};

// Obtener todos los departamentos
export const getAllDepartments = async () => {
  try {
    const response = await api.get('/employees/departments');
    return response.data;
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    throw error;
  }
};

// Obtener todos los cargos
export const getAllPositions = async () => {
  try {
    const response = await api.get('/employees/positions');
    return response.data;
  } catch (error) {
    console.error('Error al obtener cargos:', error);
    throw error;
  }
};

// Obtener estadísticas de empleados
export const getEmployeeStats = async () => {
  try {
    const response = await api.get('/employees/stats');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de empleados:', error);
    throw error;
  }
};