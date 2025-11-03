// backend/src/routes/employees.js
const express = require('express');
const { body, param, query } = require('express-validator');
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============= RUTAS DE LISTADO =============

/**
 * GET /employees
 * Listar todos los empleados
 */
router.get('/', employeeController.getAllEmployees);

/**
 * GET /employees/paginated
 * Listar empleados con paginación
 */
router.get('/paginated', employeeController.getAllEmployeesPaginated);

/**
 * GET /employees/search
 * Buscar empleados
 */
router.get('/search',
  query('q').notEmpty().withMessage('Parámetro de búsqueda requerido'),
  employeeController.searchEmployees
);

/**
 * GET /employees/status/:status
 * Empleados por estado
 */
router.get('/status/:status',
  param('status').isIn(['ACTIVE', 'INACTIVE', 'VACATION', 'SUSPENDED'])
    .withMessage('Estado inválido'),
  employeeController.getEmployeesByStatus
);

// ============= RUTAS DE CATÁLOGOS =============

/**
 * GET /employees/departments
 * Obtener todos los departamentos
 */
router.get('/departments', employeeController.getAllDepartments);

/**
 * GET /employees/positions
 * Obtener todos los cargos
 */
router.get('/positions', employeeController.getAllPositions);

/**
 * GET /employees/stats
 * Obtener estadísticas de empleados
 */
router.get('/stats', employeeController.getEmployeeStats);

// ============= RUTAS DE EMPLEADO INDIVIDUAL =============

/**
 * GET /employees/document/:document
 * Obtener empleado por documento
 */
router.get('/document/:document',
  param('document').notEmpty().withMessage('Documento es requerido'),
  employeeController.getEmployeeByDocument
);

/**
 * GET /employees/:id
 * Obtener empleado por ID
 */
router.get('/:id',
  param('id').isInt().withMessage('ID inválido'),
  employeeController.getEmployeeById
);

/**
 * POST /employees
 * Crear empleado
 */
router.post('/',
  body('document')
    .notEmpty().withMessage('Documento es requerido')
    .trim(),
  body('firstName')
    .notEmpty().withMessage('Nombre es requerido')
    .trim(),
  body('lastName')
    .notEmpty().withMessage('Apellido es requerido')
    .trim(),
  body('email')
    .notEmpty().withMessage('Email es requerido')
    .isEmail().withMessage('Email debe tener formato válido'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('hireDate')
    .optional()
    .isISO8601().withMessage('Fecha de contratación inválida'),
  body('salary')
    .optional()
    .isFloat({ min: 0 }).withMessage('Salario debe ser mayor o igual a 0'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'VACATION', 'SUSPENDED'])
    .withMessage('Estado inválido'),
  employeeController.createEmployee
);

/**
 * PUT /employees/:id
 * Actualizar empleado
 */
router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  body('document')
    .notEmpty().withMessage('Documento es requerido')
    .trim(),
  body('firstName')
    .notEmpty().withMessage('Nombre es requerido')
    .trim(),
  body('lastName')
    .notEmpty().withMessage('Apellido es requerido')
    .trim(),
  body('email')
    .notEmpty().withMessage('Email es requerido')
    .isEmail().withMessage('Email debe tener formato válido'),
  employeeController.updateEmployee
);

/**
 * DELETE /employees/:id
 * Desactivar empleado
 */
router.delete('/:id',
  param('id').isInt().withMessage('ID inválido'),
  employeeController.deleteEmployee
);

/**
 * PATCH /employees/:id/status
 * Cambiar estado del empleado
 */
router.patch('/:id/status',
  param('id').isInt().withMessage('ID inválido'),
  body('status')
    .notEmpty().withMessage('Estado es requerido')
    .isIn(['ACTIVE', 'INACTIVE', 'VACATION', 'SUSPENDED'])
    .withMessage('Estado inválido'),
  employeeController.changeEmployeeStatus
);

module.exports = router;