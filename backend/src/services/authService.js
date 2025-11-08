    // backend/src/services/authService.js
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const prisma = require('../config/database');

class AuthService {
  
  /**
   * Autenticar usuario con username/email y password
   */
  async authenticate(username, password) {
    // Buscar usuario por username o email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    });
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    
    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new Error('Usuario inactivo');
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }
    
    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Generar token JWT
    const token = generateToken(user);
    
    // Retornar respuesta
    return {
      token,
      type: 'Bearer',
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email
    };
  }
  
  /**
   * Crear usuario para un empleado existente (solo ADMIN)
   */
  async createUserForEmployee(employeeId) {
    // Buscar empleado
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: { user: true }
    });
    
    if (!employee) {
      throw new Error(`Empleado no encontrado con ID: ${employeeId}`);
    }
    
    // Verificar si el empleado ya tiene un usuario
    if (employee.user) {
      throw new Error('El empleado ya tiene un usuario de sistema asociado');
    }
    
    // Verificar si ya existe un usuario con el mismo email
    const existingUser = await prisma.user.findUnique({
      where: { email: employee.email }
    });
    
    if (existingUser) {
      throw new Error(`Ya existe un usuario con el email: ${employee.email}`);
    }
    
    // Hash de contraseña temporal (usar documento del empleado)
    const hashedPassword = await bcrypt.hash(employee.document, 10);
    
    // Crear usuario en una transacción
    const newUser = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          username: employee.email,
          password: hashedPassword,
          email: employee.email,
          fullName: `${employee.firstName} ${employee.lastName}`,
          role: 'EMPLOYEE',
          employeeId: employee.id
        }
      });
      
      return user;
    });
    
    // Generar token
    const token = generateToken(newUser);
    
    return {
      token,
      type: 'Bearer',
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      email: newUser.email
    };
  }
  
  /**
   * Obtener usuario por ID
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    return user;
  }
  
  /**
   * Obtener usuario por username
   */
  async getUserByUsername(username) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    return user;
  }
  
  /**
   * Cambiar contraseña
   */
  async changePassword(userId, oldPassword, newPassword) {
    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword }
    });
    
    return { message: 'Contraseña actualizada exitosamente' };
  }
  
  /**
   * Generar hash de contraseña (útil para testing)
   */
  async generatePasswordHash(password) {
    return await bcrypt.hash(password, 10);
  }
  
  /**
   * Verificar si es administrador
   */
  isAdmin(user) {
    return user.role === 'ADMIN';
  }
}

module.exports = new AuthService();