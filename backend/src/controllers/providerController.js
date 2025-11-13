// backend/src/controllers/providerController.js
const providerService = require('../services/providerService');
const { validationResult } = require('express-validator');

class ProviderController {
  
  /**
   * POST /providers - Crear proveedor
   * Solo ADMIN
   */
  async createProvider(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const provider = await providerService.createProvider(req.body, warehouse);
      
      res.status(201).json(provider);
      
    } catch (error) {
      if (error.message.includes('ya existe')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * PUT /providers/:id - Actualizar proveedor
   * Solo ADMIN
   */
  async updateProvider(req, res, next) {
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
      const provider = await providerService.updateProvider(id, req.body, warehouse);
      
      res.json(provider);
      
    } catch (error) {
      if (error.message === 'Proveedor no encontrado en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('ya existe')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /providers/:id - Obtener proveedor por ID
   */
  async getProviderById(req, res, next) {
    try {
      const { id } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const provider = await providerService.getProviderById(id, warehouse);
      
      res.json(provider);
      
    } catch (error) {
      if (error.message === 'Proveedor no encontrado en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /providers/document/:document - Obtener proveedor por documento
   */
  async getProviderByDocument(req, res, next) {
    try {
      const { document } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const provider = await providerService.getProviderByDocument(document, warehouse);
      
      res.json(provider);
      
    } catch (error) {
      if (error.message === 'Proveedor no encontrado en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /providers - Listar todos los proveedores
   */
  async getAllProviders(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const providers = await providerService.getAllProviders(warehouse);
      res.json(providers);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /providers/paginated - Listar proveedores con paginación
   */
  async getAllProvidersPaginated(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      
      const result = await providerService.getAllProvidersPaginated(page, limit, warehouse);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /providers/active - Listar proveedores activos
   */
  async getActiveProviders(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const providers = await providerService.getActiveProviders(warehouse);
      res.json(providers);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /providers/search - Buscar proveedores
   */
  async searchProviders(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Parámetro de búsqueda requerido' 
        });
      }
      
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const providers = await providerService.searchProviders(q.trim(), warehouse);
      res.json(providers);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /providers/cities - Obtener ciudades
   */
  async getAllCities(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const cities = await providerService.getAllCities(warehouse);
      res.json(cities);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /providers/countries - Obtener países
   */
  async getAllCountries(req, res, next) {
    try {
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const countries = await providerService.getAllCountries(warehouse);
      res.json(countries);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /providers/:id - Desactivar proveedor
   * Solo ADMIN
   */
  async deleteProvider(req, res, next) {
    try {
      const { id } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const result = await providerService.deleteProvider(id, warehouse);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Proveedor no encontrado en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * PATCH /providers/:id/activate - Activar proveedor
   * Solo ADMIN
   */
  async activateProvider(req, res, next) {
    try {
      const { id } = req.params;
      const warehouse = req.warehouse || req.user.warehouse; // NUEVO: Obtener bodega
      const result = await providerService.activateProvider(id, warehouse);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Proveedor no encontrado en esta bodega') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new ProviderController();