// backend/src/routes/products.js
const express = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============= RUTAS DE LISTADO =============

/**
 * GET /products
 * Listar todos los productos
 */
router.get('/', productController.getAllProducts);

/**
 * GET /products/paginated
 * Listar productos con paginación
 */
router.get('/paginated', productController.getAllProductsPaginated);

/**
 * GET /products/active
 * Listar solo productos activos
 */
router.get('/active', productController.getActiveProducts);

/**
 * GET /products/search
 * Buscar productos
 */
router.get('/search',
  query('q').notEmpty().withMessage('Parámetro de búsqueda requerido'),
  productController.searchProducts
);

/**
 * GET /products/low-stock
 * Productos con stock bajo
 */
router.get('/low-stock', productController.getLowStockProducts);

// ============= RUTAS DE CATÁLOGOS =============

/**
 * GET /products/categories
 * Obtener todas las categorías
 */
router.get('/categories', productController.getAllCategories);

/**
 * GET /products/brands
 * Obtener todas las marcas
 */
router.get('/brands', productController.getAllBrands);

/**
 * GET /products/materials
 * Obtener todos los materiales
 */
router.get('/materials', productController.getAllMaterials);

/**
 * GET /products/colors
 * Obtener todos los colores
 */
router.get('/colors', productController.getAllColors);

// ============= RUTAS DE PRODUCTO INDIVIDUAL =============

/**
 * GET /products/:id
 * Obtener producto por ID
 */
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'),
  productController.getProductById
);

/**
 * POST /products
 * Crear producto (solo ADMIN)
 */
router.post('/',
  authorize('ADMIN'),
  body('code')
    .notEmpty().withMessage('Código es requerido')
    .trim(),
  body('name')
    .notEmpty().withMessage('Nombre es requerido')
    .trim(),
  body('brand')
    .notEmpty().withMessage('Marca es requerida')
    .trim(),
  body('category')
    .notEmpty().withMessage('Categoría es requerida')
    .trim(),
  body('color')
    .notEmpty().withMessage('Color es requerido')
    .trim(),
  body('material')
    .notEmpty().withMessage('Material es requerido')
    .trim(),
  body('purchasePrice')
    .notEmpty().withMessage('Precio de compra es requerido')
    .isFloat({ min: 0 }).withMessage('Precio de compra debe ser mayor o igual a 0'),
  body('salePrice')
    .notEmpty().withMessage('Precio de venta es requerido')
    .isFloat({ min: 0 }).withMessage('Precio de venta debe ser mayor o igual a 0'),
  body('minStock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock mínimo debe ser mayor o igual a 0'),
  body('stocks')
    .optional()
    .isArray().withMessage('Stocks debe ser un array'),
  body('stocks.*.size')
    .if(body('stocks').exists())
    .notEmpty().withMessage('Talla es requerida'),
  body('stocks.*.quantity')
    .if(body('stocks').exists())
    .isInt({ min: 0 }).withMessage('Cantidad debe ser mayor o igual a 0'),
  productController.createProduct
);

/**
 * PUT /products/:id
 * Actualizar producto (solo ADMIN)
 */
router.put('/:id',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  body('code')
    .notEmpty().withMessage('Código es requerido')
    .trim(),
  body('name')
    .notEmpty().withMessage('Nombre es requerido')
    .trim(),
  body('brand')
    .notEmpty().withMessage('Marca es requerida')
    .trim(),
  body('category')
    .notEmpty().withMessage('Categoría es requerida')
    .trim(),
  body('color')
    .notEmpty().withMessage('Color es requerido')
    .trim(),
  body('material')
    .notEmpty().withMessage('Material es requerido')
    .trim(),
  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Precio de compra debe ser mayor o igual a 0'),
  body('salePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Precio de venta debe ser mayor o igual a 0'),
  body('minStock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock mínimo debe ser mayor o igual a 0'),
  body('stocks')
    .optional()
    .isArray().withMessage('Stocks debe ser un array'),
  productController.updateProduct
);

/**
 * DELETE /products/:id
 * Desactivar producto (solo ADMIN)
 */
router.delete('/:id',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  productController.deleteProduct
);

/**
 * PATCH /products/:id/activate
 * Activar producto (solo ADMIN)
 */
router.patch('/:id/activate',
  authorize('ADMIN'),
  param('id').isInt().withMessage('ID inválido'),
  productController.activateProduct
);

module.exports = router;