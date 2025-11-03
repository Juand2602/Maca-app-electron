// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-super-seguro-cambiame-en-produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Middleware de autenticación JWT
 * Verifica el token y agrega el usuario al request
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No autorizado',
        message: 'Credenciales de acceso requeridas' 
      });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          message: 'Tu sesión ha expirado, por favor inicia sesión nuevamente' 
        });
      }
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Token JWT inválido' 
      });
    }
    
    // Buscar usuario en base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            position: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al token no existe' 
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Usuario inactivo',
        message: 'Tu cuenta ha sido desactivada' 
      });
    }
    
    // Agregar usuario al request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ 
      error: 'Error de autenticación',
      message: 'Ocurrió un error al verificar tus credenciales' 
    });
  }
};

/**
 * Middleware de autorización por rol
 * Verifica que el usuario tenga uno de los roles permitidos
 * 
 * Uso: authorize('ADMIN') o authorize('ADMIN', 'MANAGER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autorizado',
        message: 'Debes iniciar sesión para acceder a este recurso' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Prohibido',
        message: 'No tienes permisos suficientes para realizar esta acción',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Generar token JWT para un usuario
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRATION 
  });
};

/**
 * Generar token desde username (para crear usuarios)
 */
const generateTokenFromUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      role: true
    }
  });
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  return generateToken(user);
};

/**
 * Verificar token sin middleware (útil para otros servicios)
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decodificar token sin verificar (útil para debugging)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Verificar si el usuario actual es administrador
 */
const isAdmin = (req) => {
  return req.user && req.user.role === 'ADMIN';
};

/**
 * Middleware opcional: permite acceso sin autenticación pero agrega user si hay token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true
        }
      });
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignorar errores en auth opcional
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  generateToken,
  generateTokenFromUsername,
  verifyToken,
  decodeToken,
  isAdmin,
  optionalAuth,
  JWT_SECRET,
  JWT_EXPIRATION
};