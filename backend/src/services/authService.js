const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const prisma = require('../config/database');

class AuthService {
  
  /**
   * Autenticar usuario con username/email, password y bodega
   */
  async authenticate(username, password, warehouse = 'San Francisco') {
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
    
    // Actualizar último login y bodega
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        warehouse: warehouse // Guardar la bodega seleccionada
      }
    });
    
    // Generar token JWT (incluye bodega en el payload)
    const token = generateToken({ ...user, warehouse });
    
    // Retornar respuesta
    return {
      token,
      type: 'Bearer',
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      warehouse: warehouse // Incluir bodega en la respuesta
    };
  }
  
  /**
   * Crear usuario para un empleado existente (solo ADMIN)
   */
  async createUserForEmployee(employeeId, warehouse = 'San Francisco') {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: { user: true }
    });
    
    if (!employee) {
      throw new Error(`Empleado no encontrado con ID: ${employeeId}`);
    }
    
    if (employee.user) {
      throw new Error('El empleado ya tiene un usuario de sistema asociado');
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { email: employee.email }
    });
    
    if (existingUser) {
      throw new Error(`Ya existe un usuario con el email: ${employee.email}`);
    }
    
    const hashedPassword = await bcrypt.hash(employee.document, 10);
    
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: employee.email,
          password: hashedPassword,
          email: employee.email,
          fullName: `${employee.firstName} ${employee.lastName}`,
          role: 'EMPLOYEE',
          warehouse: warehouse, // Asignar bodega al crear usuario
          employeeId: employee.id
        }
      });
      
      return user;
    });
    
    const token = generateToken(newUser);
    
    return {
      token,
      type: 'Bearer',
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      email: newUser.email,
      warehouse: newUser.warehouse
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
        warehouse: true, // Incluir bodega
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
        warehouse: true, // Incluir bodega
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
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
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