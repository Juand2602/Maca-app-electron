// backend/src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');

class DashboardController {
  // GET /api/dashboard/stats
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      next(error);
    }
  }

  // GET /api/dashboard/recent-sales
  async getRecentSales(req, res, next) {
    try {
      const sales = await dashboardService.getRecentSales();
      res.json({
        success: true,
        data: sales
      });
    } catch (error) {
      console.error('Error in getRecentSales:', error);
      next(error);
    }
  }

  // GET /api/dashboard/top-products
  async getTopProducts(req, res, next) {
    try {
      const products = await dashboardService.getTopProducts();
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      next(error);
    }
  }

  // GET /api/dashboard/sales-chart
  async getSalesChart(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;
      const chartData = await dashboardService.getSalesChart(days);
      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('Error in getSalesChart:', error);
      next(error);
    }
  }

  // GET /api/dashboard/low-stock
  async getLowStock(req, res, next) {
    try {
      const threshold = parseInt(req.query.threshold) || 10;
      const products = await dashboardService.getLowStock(threshold);
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      console.error('Error in getLowStock:', error);
      next(error);
    }
  }
}

module.exports = new DashboardController();