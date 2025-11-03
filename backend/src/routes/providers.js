// backend/src/routes/providers.js
const express = require('express');
const { body, param, query } = require('express-validator');
const providerController = require('../controllers/providerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============= RUTAS DE LISTADO =============

/**
 * GET /providers
 * Listar todos los proveedores
 */
router.get('/', providerController.getAllProviders);

/**
 * GET /providers/paginated
 * Listar proveedores con paginación
 */
router.get('/paginated', providerController.getAllProvidersPaginated);

/**
 * GET /providers/active
 * Listar solo proveedores activos
 */
router.get('/active', providerController.getActiveProviders);

/**
 * GET /providers/search
 * Buscar proveedores
 */
router.get('/search',
  query('q').notEmpty().withMessage('Parámetro de búsqueda requerido'),
  providerController.searchProviders
);

// ============= RUTAS DE CATÁLOGOS =============

/**
 * GET /providers/cities
 * Obtener todas las ciudades
 */
router.get('/cities', providerController.getAllCities);

/**
 * GET /providers/countries
 * Obtener todos los países
 */
router.get('/countries', providerController.getAllCountries);

// ============= RUTAS DE PROVEEDOR INDIVIDUAL =============

/**
 * GET /providers/document/:document
 * Obtener proveedor por documento
 */
router.get('/document/:document',
  param('document').notEmpty().withMessage('Documento es requerido'),
  providerController.getProviderByDocument
);

/**
 * GET /providers/:id
 * Obtener proveedor por ID
 */
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'),
  providerController.getProviderById
);

/**
 * POST /providers
 * Crear proveedor (solo ADMIN)
 */
router.post('/',
  authorize('ADMIN'),
  body('document')
    .notEmpty().withMessage('Documento es requerido')
    .trim(),
  body('name')
    .notEmpty().withMessage('Nombre es requerido')
    .trim(),
  body('email')
    .optional()
    .isEmail().withMessage('Email debe tener formato válido'),
  body('paymentDays')
    .optional()
    .isInt({ min: 0 }).withMessage('Días de pago debe ser mayor o igual a 0'),
  providerController.createProvider
);

/**
 * PUT /providers/:id
 * Actualizar proveedor (solo ADMIN)
 */
router.put('/:id',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  body('document')
    .notEmpty().withMessage('Documento es requerido')
    .trim(),
  body('name')
    .notEmpty().withMessage('Nombre es requerido')
    .trim(),
  body('email')
    .optional()
    .isEmail().withMessage('Email debe tener formato válido'),
  body('paymentDays')
    .optional()
    .isInt({ min: 0 }).withMessage('Días de pago debe ser mayor o igual a 0'),
  providerController.updateProvider
);

/**
 * DELETE /providers/:id
 * Desactivar proveedor (solo ADMIN)
 */
router.delete('/:id',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  providerController.deleteProvider
);

/**
 * PATCH /providers/:id/activate
 * Activar proveedor (solo ADMIN)
 */
router.patch('/:id/activate',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  providerController.activateProvider
);

module.exports = router;