// src/services/usersService.js
import api from './api';

// Crear usuario para un empleado
export const createUserForEmployee = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};