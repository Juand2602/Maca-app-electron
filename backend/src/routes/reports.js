// backend/src/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /reports/sales
 * Reporte de Ventas por período
 */
router.get('/sales', reportController.getSalesReport);

/**
 * GET /reports/purchases
 * Reporte de Compras por período
 */
router.get('/purchases', reportController.getPurchasesReport);

/**
 * GET /reports/inventory
 * Reporte de Inventario actual
 */
router.get('/inventory', reportController.getInventoryReport);

/**
 * GET /reports/profit-loss
 * Estado de Resultados (P&L)
 */
router.get('/profit-loss', reportController.getProfitLossReport);

/**
 * GET /reports/providers
 * Reporte de Proveedores
 */
router.get('/providers', reportController.getProvidersReport);

/**
 * GET /reports/employee-commissions
 * Reporte de Comisiones de Empleados
 */
router.get('/employee-commissions', reportController.getEmployeeCommissionsReport);

module.exports = router;