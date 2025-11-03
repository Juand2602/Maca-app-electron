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
      const invoice = await invoiceService.createInvoice(req.body, userId);
      
      res.status(201).json(invoice);
      
    } catch (error) {
      if (error.message === 'Proveedor no encontrado' ||
          error.message === 'El número de factura ya existe') {
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
      const result = await invoiceService.addPayment(req.body, userId);
      
      res.status(201).json(result);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada' ||
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
      const invoice = await invoiceService.getInvoiceById(id);
      
      res.json(invoice);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada') {
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
      const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);
      
      res.json(invoice);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada') {
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
      const invoices = await invoiceService.getAllInvoices();
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
      
      const result = await invoiceService.getAllInvoicesPaginated(page, limit);
      
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
      
      const invoices = await invoiceService.getInvoicesByStatus(status.toUpperCase());
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
      const invoices = await invoiceService.getInvoicesByProvider(providerId);
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
      const invoices = await invoiceService.getOverdueInvoices();
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
      
      const invoices = await invoiceService.getInvoicesByDateRange(startDate, endDate);
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
      const total = await invoiceService.getTotalByStatus(status.toUpperCase());
      
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
      const total = await invoiceService.getTotalPendingBalance();
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
      const invoice = await invoiceService.updateInvoice(id, req.body);
      
      res.json(invoice);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada' ||
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
      const result = await invoiceService.cancelInvoice(id);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Factura no encontrada' ||
          error.message.includes('No se puede cancelar')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new InvoiceController();