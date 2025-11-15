// backend/src/controllers/reportController.js
const reportService = require('../services/reportService');
const { validationResult } = require('express-validator');

class ReportController {
  
  /**
   * GET /reports/sales - Reporte de Ventas
   */
  async getSalesReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse;
      const report = await reportService.getSalesReport(startDate, endDate, warehouse);
      
      res.json(report);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /reports/purchases - Reporte de Compras
   */
  async getPurchasesReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse;
      const report = await reportService.getPurchasesReport(startDate, endDate, warehouse);
      
      res.json(report);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /reports/inventory - Reporte de Inventario
   */
  async getInventoryReport(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse;
      const report = await reportService.getInventoryReport(warehouse);
      
      res.json(report);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /reports/profit-loss - Estado de Resultados
   */
  async getProfitLossReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse;
      const report = await reportService.getProfitLossReport(startDate, endDate, warehouse);
      
      res.json(report);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /reports/providers - Reporte de Proveedores
   */
  async getProvidersReport(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse;
      const report = await reportService.getProvidersReport(warehouse);
      
      res.json(report);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /reports/employee-commissions - Reporte de Comisiones de Empleados
   */
  async getEmployeeCommissionsReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse;
      const report = await reportService.getEmployeeCommissionsReport(startDate, endDate, warehouse);
      
      res.json(report);
      
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();