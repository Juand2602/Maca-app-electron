// backend/src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// Todas las rutas del dashboard requieren autenticación
router.use(authenticate);

// GET /api/dashboard/stats - Estadísticas generales
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/recent-sales - Ventas recientes
router.get('/recent-sales', dashboardController.getRecentSales);

// GET /api/dashboard/top-products - Productos más vendidos
router.get('/top-products', dashboardController.getTopProducts);

// GET /api/dashboard/sales-chart - Datos para gráfico de ventas
router.get('/sales-chart', dashboardController.getSalesChart);

// GET /api/dashboard/low-stock - Productos con stock bajo
router.get('/low-stock', dashboardController.getLowStock);

module.exports = router;