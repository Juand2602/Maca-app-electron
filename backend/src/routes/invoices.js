// backend/src/routes/invoices.js
const express = require('express');
const { body, param, query } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============= RUTAS DE LISTADO =============

/**
 * GET /invoices
 * Listar todas las facturas
 */
router.get('/', invoiceController.getAllInvoices);

/**
 * GET /invoices/paginated
 * Listar facturas con paginación
 */
router.get('/paginated', invoiceController.getAllInvoicesPaginated);

/**
 * GET /invoices/overdue
 * Facturas vencidas
 */
router.get('/overdue', invoiceController.getOverdueInvoices);

/**
 * GET /invoices/by-date-range
 * Facturas por rango de fechas
 */
router.get('/by-date-range',
  query('startDate').notEmpty().withMessage('startDate es requerido'),
  query('endDate').notEmpty().withMessage('endDate es requerido'),
  invoiceController.getInvoicesByDateRange
);

/**
 * GET /invoices/status/:status
 * Facturas por estado
 */
router.get('/status/:status',
  param('status').isIn(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'])
    .withMessage('Estado inválido'),
  invoiceController.getInvoicesByStatus
);

/**
 * GET /invoices/provider/:providerId
 * Facturas por proveedor
 */
router.get('/provider/:providerId',
  param('providerId').isInt().withMessage('ID de proveedor inválido'),
  invoiceController.getInvoicesByProvider
);

// ============= RUTAS DE TOTALES =============

/**
 * GET /invoices/totals/status/:status
 * Total de facturas por estado
 */
router.get('/totals/status/:status',
  param('status').isIn(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'])
    .withMessage('Estado inválido'),
  invoiceController.getTotalByStatus
);

/**
 * GET /invoices/totals/pending-balance
 * Balance pendiente total
 */
router.get('/totals/pending-balance', invoiceController.getTotalPendingBalance);

// ============= RUTAS DE FACTURA INDIVIDUAL =============

/**
 * GET /invoices/number/:invoiceNumber
 * Obtener factura por número
 */
router.get('/number/:invoiceNumber',
  param('invoiceNumber').notEmpty().withMessage('Número de factura es requerido'),
  invoiceController.getInvoiceByNumber
);

/**
 * GET /invoices/:id
 * Obtener factura por ID
 */
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'),
  invoiceController.getInvoiceById
);

/**
 * POST /invoices
 * Crear factura (solo ADMIN)
 */
router.post('/',
  authorize('ADMIN'),
  body('invoiceNumber')
    .notEmpty().withMessage('Número de factura es requerido')
    .trim(),
  body('providerId')
    .notEmpty().withMessage('Proveedor es requerido')
    .isInt().withMessage('ID de proveedor inválido'),
  body('issueDate')
    .notEmpty().withMessage('Fecha de emisión es requerida')
    .isISO8601().withMessage('Fecha de emisión inválida'),
  body('dueDate')
    .notEmpty().withMessage('Fecha de vencimiento es requerida')
    .isISO8601().withMessage('Fecha de vencimiento inválida'),
  body('subtotal')
    .notEmpty().withMessage('Subtotal es requerido')
    .isFloat({ min: 0 }).withMessage('Subtotal debe ser mayor o igual a 0'),
  body('tax')
    .optional()
    .isFloat({ min: 0 }).withMessage('Impuesto debe ser mayor o igual a 0'),
  body('discount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Descuento debe ser mayor o igual a 0'),
  body('total')
    .notEmpty().withMessage('Total es requerido')
    .isFloat({ min: 0 }).withMessage('Total debe ser mayor o igual a 0'),
  invoiceController.createInvoice
);

/**
 * POST /invoices/payments
 * Agregar pago a factura
 */
router.post('/payments',
  body('invoiceId')
    .notEmpty().withMessage('ID de factura es requerido')
    .isInt().withMessage('ID de factura inválido'),
  body('paymentDate')
    .notEmpty().withMessage('Fecha de pago es requerida')
    .isISO8601().withMessage('Fecha de pago inválida'),
  body('amount')
    .notEmpty().withMessage('Monto es requerido')
    .isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('paymentMethod')
    .notEmpty().withMessage('Método de pago es requerido')
    .isIn(['CASH', 'CARD', 'TRANSFER', 'MIXED']).withMessage('Método de pago inválido'),
  invoiceController.addPayment
);

/**
 * PUT /invoices/:id
 * Actualizar factura (solo ADMIN)
 */
router.put('/:id',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  invoiceController.updateInvoice
);

/**
 * DELETE /invoices/:id
 * Cancelar factura (solo ADMIN)
 */
router.delete('/:id',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  invoiceController.cancelInvoice
);

module.exports = router;