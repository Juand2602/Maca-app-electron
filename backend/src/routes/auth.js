// backend/src/routes/auth.js
const express = require('express');
const { body, param } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/signin
 * Login de usuario
 * Público
 */
router.post('/signin',
  body('username')
    .notEmpty().withMessage('Username es requerido')
    .trim(),
  body('password')
    .notEmpty().withMessage('Password es requerido'),
  authController.signin
);

/**
 * POST /auth/create-user/:employeeId
 * Crear usuario para un empleado existente
 * Solo ADMIN
 */
router.post('/create-user/:employeeId',
  authenticate,
  authorize('ADMIN'),
  param('employeeId').isInt().withMessage('ID de empleado inválido'),
  authController.createUserForEmployee
);

/**
 * GET /auth/me
 * Obtener información del usuario actual
 * Requiere autenticación
 */
router.get('/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * POST /auth/change-password
 * Cambiar contraseña del usuario actual
 * Requiere autenticación
 */
router.post('/change-password',
  authenticate,
  body('oldPassword')
    .notEmpty().withMessage('Contraseña actual es requerida'),
  body('newPassword')
    .notEmpty().withMessage('Nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
  authController.changePassword
);

/**
 * POST /auth/logout
 * Cerrar sesión (client-side en JWT)
 * Requiere autenticación
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * GET /auth/validate-token
 * Validar token actual
 * Requiere autenticación
 */
router.get('/validate-token',
  authenticate,
  authController.validateToken
);

/**
 * GET /auth/test
 * Endpoint de prueba
 * Público
 */
router.get('/test',
  authController.test
);

/**
 * POST /auth/generate-hash
 * Generar hash de contraseña (solo desarrollo)
 * Público pero solo funciona en desarrollo
 */
router.post('/generate-hash',
  body('password').notEmpty().withMessage('Password es requerido'),
  authController.generateHash
);

module.exports = router;