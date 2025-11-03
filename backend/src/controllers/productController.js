// backend/src/controllers/productController.js
const productService = require('../services/productService');
const { validationResult } = require('express-validator');

class ProductController {
  
  /**
   * POST /products - Crear producto
   * Solo ADMIN
   */
  async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const product = await productService.createProduct(req.body);
      
      res.status(201).json(product);
      
    } catch (error) {
      if (error.message === 'El código del producto ya existe') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * PUT /products/:id - Actualizar producto
   * Solo ADMIN
   */
  async updateProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      
      res.json(product);
      
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'El código del producto ya existe') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /products/:id - Obtener producto por ID
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      
      res.json(product);
      
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /products - Listar todos los productos
   */
  async getAllProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/paginated - Listar productos con paginación
   */
  async getAllProductsPaginated(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await productService.getAllProductsPaginated(page, limit);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/active - Listar productos activos
   */
  async getActiveProducts(req, res, next) {
    try {
      const products = await productService.getActiveProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/search - Buscar productos
   */
  async searchProducts(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Parámetro de búsqueda requerido' 
        });
      }
      
      const products = await productService.searchProducts(q.trim());
      res.json(products);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/low-stock - Productos con stock bajo
   */
  async getLowStockProducts(req, res, next) {
    try {
      const products = await productService.getLowStockProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/categories - Obtener categorías
   */
  async getAllCategories(req, res, next) {
    try {
      const categories = await productService.getAllCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/brands - Obtener marcas
   */
  async getAllBrands(req, res, next) {
    try {
      const brands = await productService.getAllBrands();
      res.json(brands);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/materials - Obtener materiales
   */
  async getAllMaterials(req, res, next) {
    try {
      const materials = await productService.getAllMaterials();
      res.json(materials);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /products/colors - Obtener colores
   */
  async getAllColors(req, res, next) {
    try {
      const colors = await productService.getAllColors();
      res.json(colors);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /products/:id - Desactivar producto
   * Solo ADMIN
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * PATCH /products/:id/activate - Activar producto
   * Solo ADMIN
   */
  async activateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await productService.activateProduct(id);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new ProductController();