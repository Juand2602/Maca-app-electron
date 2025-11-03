// backend/src/routes/sales.js
const express = require('express');
const { body, param, query } = require('express-validator');
const saleController = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============= RUTAS DE LISTADO =============

/**
 * GET /sales
 * Listar todas las ventas
 */
router.get('/', saleController.getAllSales);

/**
 * GET /sales/paginated
 * Listar ventas con paginación
 */
router.get('/paginated', saleController.getAllSalesPaginated);

/**
 * GET /sales/by-date-range
 * Ventas por rango de fechas
 */
router.get('/by-date-range',
  query('startDate').notEmpty().isISO8601().withMessage('startDate debe ser una fecha válida'),
  query('endDate').notEmpty().isISO8601().withMessage('endDate debe ser una fecha válida'),
  saleController.getSalesByDateRange
);

/**
 * GET /sales/search
 * Buscar ventas
 */
router.get('/search',
  query('q').notEmpty().withMessage('Parámetro de búsqueda requerido'),
  saleController.searchSales
);

/**
 * GET /sales/totals
 * Obtener totales por rango de fechas
 */
router.get('/totals',
  query('startDate').notEmpty().isISO8601().withMessage('startDate debe ser una fecha válida'),
  query('endDate').notEmpty().isISO8601().withMessage('endDate debe ser una fecha válida'),
  saleController.getTotalsByDateRange
);

// ============= RUTAS DE VENTA INDIVIDUAL =============

/**
 * GET /sales/number/:saleNumber
 * Obtener venta por número
 */
router.get('/number/:saleNumber',
  param('saleNumber').notEmpty().withMessage('Número de venta es requerido'),
  saleController.getSaleBySaleNumber
);

/**
 * GET /sales/:id
 * Obtener venta por ID
 */
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'),
  saleController.getSaleById
);

/**
 * POST /sales
 * Crear venta
 */
router.post('/',
  // Validar items
  body('items')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
  body('items.*.productId')
    .notEmpty().withMessage('ID del producto es requerido')
    .isInt().withMessage('ID del producto debe ser un número'),
  body('items.*.size')
    .notEmpty().withMessage('Talla es requerida'),
  body('items.*.quantity')
    .notEmpty().withMessage('Cantidad es requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  
  // Validar pagos (opcional, por compatibilidad)
  body('payments')
    .optional()
    .isArray().withMessage('Payments debe ser un array'),
  body('payments.*.paymentMethod')
    .if(body('payments').exists())
    .isIn(['CASH', 'CARD', 'TRANSFER', 'MIXED']).withMessage('Método de pago inválido'),
  body('payments.*.amount')
    .if(body('payments').exists())
    .isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  
  // Validar campos opcionales
  body('discount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Descuento debe ser mayor o igual a 0'),
  body('tax')
    .optional()
    .isFloat({ min: 0 }).withMessage('Impuesto debe ser mayor o igual a 0'),
  
  saleController.createSale
);

/**
 * PATCH /sales/:id/cancel
 * Cancelar venta
 */
router.patch('/:id/cancel',
  param('id').isInt().withMessage('ID inválido'),
  saleController.cancelSale
);

module.exports = router;