// backend/src/controllers/saleController.js
const saleService = require('../services/saleService');
const { validationResult } = require('express-validator');

class SaleController {
  
  /**
   * POST /sales - Crear venta
   */
  async createSale(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const userId = req.user.id;
      const sale = await saleService.createSale(req.body, userId);
      
      res.status(201).json(sale);
      
    } catch (error) {
      if (error.message.includes('no encontrado') ||
          error.message.includes('no está activo') ||
          error.message.includes('Stock insuficiente') ||
          error.message.includes('no cubren el total') ||
          error.message.includes('al menos un')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /sales/:id - Obtener venta por ID
   */
  async getSaleById(req, res, next) {
    try {
      const { id } = req.params;
      const sale = await saleService.getSaleById(id);
      
      res.json(sale);
      
    } catch (error) {
      if (error.message === 'Venta no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /sales/number/:saleNumber - Obtener venta por número
   */
  async getSaleBySaleNumber(req, res, next) {
    try {
      const { saleNumber } = req.params;
      const sale = await saleService.getSaleBySaleNumber(saleNumber);
      
      res.json(sale);
      
    } catch (error) {
      if (error.message === 'Venta no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /sales - Listar todas las ventas
   */
  async getAllSales(req, res, next) {
    try {
      const sales = await saleService.getAllSales();
      res.json(sales);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /sales/paginated - Listar ventas con paginación
   */
  async getAllSalesPaginated(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await saleService.getAllSalesPaginated(page, limit);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /sales/by-date-range - Ventas por rango de fechas
   */
  async getSalesByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const sales = await saleService.getSalesByDateRange(startDate, endDate);
      res.json(sales);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /sales/search - Buscar ventas
   */
  async searchSales(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Parámetro de búsqueda requerido' 
        });
      }
      
      const sales = await saleService.searchSales(q.trim());
      res.json(sales);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /sales/totals - Obtener totales por rango de fechas
   */
  async getTotalsByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const [totalSales, count] = await Promise.all([
        saleService.getTotalSalesByDateRange(startDate, endDate),
        saleService.countSalesByDateRange(startDate, endDate)
      ]);
      
      res.json({
        totalSales,
        count,
        startDate,
        endDate
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * PATCH /sales/:id/cancel - Cancelar venta
   */
  async cancelSale(req, res, next) {
    try {
      const { id } = req.params;
      const result = await saleService.cancelSale(id);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Venta no encontrada' ||
          error.message === 'La venta ya está cancelada') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new SaleController();