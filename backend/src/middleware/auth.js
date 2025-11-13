const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-super-seguro-cambiame-en-produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Middleware de autenticación JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No autorizado',
        message: 'Credenciales de acceso requeridas' 
      });
    }
    
    const token = authHeader.substring(7);
    
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
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        warehouse: true, // NUEVO: Incluir bodega
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
    
    // Agregar usuario con bodega al request
    req.user = user;
    req.warehouse = user.warehouse || 'San Francisco'; // NUEVO: Agregar bodega al request
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
    role: user.role,
    warehouse: user.warehouse || 'San Francisco' // NUEVO: Incluir bodega en token
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRATION 
  });
};

/**
 * Middleware para filtrar por bodega
 * NUEVO: Agregar filtro de bodega a las consultas
 */
const filterByWarehouse = (req, res, next) => {
  // Agregar el filtro de bodega al query params
  if (req.warehouse) {
    req.warehouseFilter = { warehouse: req.warehouse };
  }
  next();
};

const generateTokenFromUsername = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      warehouse: true // NUEVO: Incluir bodega
    }
  });
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  return generateToken(user);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

const isAdmin = (req) => {
  return req.user && req.user.role === 'ADMIN';
};

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
          warehouse: true, // NUEVO: Incluir bodega
          isActive: true
        }
      });
      
      if (user && user.isActive) {
        req.user = user;
        req.warehouse = user.warehouse || 'San Francisco'; // NUEVO
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
  filterByWarehouse, // NUEVO: Exportar middleware de filtro
  JWT_SECRET,
  JWT_EXPIRATION
};