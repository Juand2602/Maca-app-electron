const authService = require('../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
  
  /**
   * POST /auth/signin - Iniciar sesión
   */
  async signin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const { username, password, warehouse } = req.body; // NUEVO: Recibir bodega
      
      // Autenticar usuario con bodega
      const result = await authService.authenticate(username, password, warehouse);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Credenciales inválidas' || error.message === 'Usuario inactivo') {
        return res.status(400).json({ 
          error: error.message,
          message: error.message 
        });
      }
      next(error);
    }
  }
  
  /**
   * POST /auth/create-user/:employeeId - Crear usuario para empleado
   * Solo ADMIN
   */
  async createUserForEmployee(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { warehouse } = req.body; // NUEVO: Recibir bodega opcional
      
      const result = await authService.createUserForEmployee(employeeId, warehouse);
      
      res.status(201).json(result);
      
    } catch (error) {
      if (error.message.includes('no encontrado') || 
          error.message.includes('ya tiene') ||
          error.message.includes('Ya existe')) {
        return res.status(400).json({ 
          error: error.message,
          message: error.message 
        });
      }
      next(error);
    }
  }
  
  /**
   * GET /auth/me - Obtener usuario actual
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * POST /auth/change-password - Cambiar contraseña
   */
  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      const result = await authService.changePassword(userId, oldPassword, newPassword);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Contraseña actual incorrecta') {
        return res.status(400).json({ 
          error: error.message,
          message: error.message 
        });
      }
      next(error);
    }
  }
  
  /**
   * POST /auth/logout - Cerrar sesión
   */
  async logout(req, res) {
    res.json({ 
      message: 'Sesión cerrada exitosamente',
      info: 'Token invalidado en el cliente' 
    });
  }
  
  /**
   * GET /auth/test - Endpoint de prueba
   */
  async test(req, res) {
    res.json({
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
      status: 'ok'
    });
  }
  
  /**
   * POST /auth/generate-hash - Generar hash de contraseña (para testing)
   */
  async generateHash(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
          error: 'Endpoint no disponible en producción' 
        });
      }
      
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ 
          error: 'Password es requerido' 
        });
      }
      
      const hash = await authService.generatePasswordHash(password);
      
      res.json({
        password,
        hash
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /auth/validate-token - Validar token actual
   */
  async validateToken(req, res) {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        warehouse: req.user.warehouse // NUEVO: Incluir bodega
      }
    });
  }
}

module.exports = new AuthController();