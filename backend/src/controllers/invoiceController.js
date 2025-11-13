// backend/src/controllers/invoiceController.js
const invoiceService = require('../services/invoiceService');
const { validationResult } = require('express-validator');

class InvoiceController {
  
  /**
   * POST /invoices - Crear factura
   */
  async createInvoice(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const userId = req.user?.id;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoice = await invoiceService.createInvoice(req.body, userId, warehouse);
      
      res.status(201).json(invoice);
      
    } catch (error) {
      if (error.message.includes('no encontrado') ||
          error.message.includes('ya existe')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * POST /invoices/payments - Agregar pago a factura
   */
  async addPayment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const userId = req.user?.id;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const result = await invoiceService.addPayment(req.body, userId, warehouse);
      
      res.status(201).json(result);
      
    } catch (error) {
      if (error.message.includes('no encontrada') ||
          error.message.includes('excede el balance')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /invoices/:id - Obtener factura por ID
   */
  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoice = await invoiceService.getInvoiceById(id, warehouse);
      
      res.json(invoice);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /invoices/number/:invoiceNumber - Obtener factura por número
   */
  async getInvoiceByNumber(req, res, next) {
    try {
      const { invoiceNumber } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber, warehouse);
      
      res.json(invoice);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /invoices - Listar todas las facturas
   */
  async getAllInvoices(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoices = await invoiceService.getAllInvoices(warehouse);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/paginated - Listar facturas con paginación
   */
  async getAllInvoicesPaginated(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      
      const result = await invoiceService.getAllInvoicesPaginated(page, limit, warehouse);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/status/:status - Facturas por estado
   */
  async getInvoicesByStatus(req, res, next) {
    try {
      const { status } = req.params;
      
      const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoices = await invoiceService.getInvoicesByStatus(status.toUpperCase(), warehouse);
      res.json(invoices);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/provider/:providerId - Facturas por proveedor
   */
  async getInvoicesByProvider(req, res, next) {
    try {
      const { providerId } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoices = await invoiceService.getInvoicesByProvider(providerId, warehouse);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/overdue - Facturas vencidas
   */
  async getOverdueInvoices(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoices = await invoiceService.getOverdueInvoices(warehouse);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/by-date-range - Facturas por rango de fechas
   */
  async getInvoicesByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'startDate y endDate son requeridos' 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoices = await invoiceService.getInvoicesByDateRange(startDate, endDate, warehouse);
      res.json(invoices);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/totals/status/:status - Total por estado
   */
  async getTotalByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const total = await invoiceService.getTotalByStatus(status.toUpperCase(), warehouse);
      
      res.json({ status, total });
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /invoices/totals/pending-balance - Balance pendiente total
   */
  async getTotalPendingBalance(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const total = await invoiceService.getTotalPendingBalance(warehouse);
      res.json({ totalPendingBalance: total });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * PUT /invoices/:id - Actualizar factura
   */
  async updateInvoice(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const { id } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const invoice = await invoiceService.updateInvoice(id, req.body, warehouse);
      
      res.json(invoice);
      
    } catch (error) {
      if (error.message.includes('no encontrada') ||
          error.message.includes('No se puede modificar')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * DELETE /invoices/:id - Cancelar factura
   */
  async cancelInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const result = await invoiceService.cancelInvoice(id, warehouse);
      
      res.json(result);
      
    } catch (error) {
      if (error.message.includes('no encontrada') ||
          error.message.includes('No se puede cancelar')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new InvoiceController();