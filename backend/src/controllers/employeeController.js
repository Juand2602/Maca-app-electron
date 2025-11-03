// backend/src/controllers/employeeController.js
const employeeService = require('../services/employeeService');
const { validationResult } = require('express-validator');

class EmployeeController {
  
  /**
   * POST /employees - Crear empleado
   * Solo ADMIN
   */
  async createEmployee(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const employee = await employeeService.createEmployee(req.body);
      
      res.status(201).json(employee);
      
    } catch (error) {
      if (error.message.includes('ya existe') ||
          error.message === 'Usuario no encontrado' ||
          error.message.includes('ya está asignado')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * PUT /employees/:id - Actualizar empleado
   * Solo ADMIN
   */
  async updateEmployee(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          errors: errors.array() 
        });
      }
      
      const { id } = req.params;
      const employee = await employeeService.updateEmployee(id, req.body);
      
      res.json(employee);
      
    } catch (error) {
      if (error.message === 'Empleado no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('ya existe') ||
          error.message === 'Usuario no encontrado') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /employees/:id - Obtener empleado por ID
   * Solo ADMIN
   */
  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(id);
      
      res.json(employee);
      
    } catch (error) {
      if (error.message === 'Empleado no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /employees/document/:document - Obtener empleado por documento
   * Solo ADMIN
   */
  async getEmployeeByDocument(req, res, next) {
    try {
      const { document } = req.params;
      const employee = await employeeService.getEmployeeByDocument(document);
      
      res.json(employee);
      
    } catch (error) {
      if (error.message === 'Empleado no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * GET /employees - Listar todos los empleados
   * Solo ADMIN
   */
  async getAllEmployees(req, res, next) {
    try {
      const employees = await employeeService.getAllEmployees();
      res.json(employees);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /employees/paginated - Listar empleados con paginación
   * Solo ADMIN
   */
  async getAllEmployeesPaginated(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await employeeService.getAllEmployeesPaginated(page, limit);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /employees/status/:status - Empleados por estado
   * Solo ADMIN
   */
  async getEmployeesByStatus(req, res, next) {
    try {
      const { status } = req.params;
      
      const validStatuses = ['ACTIVE', 'INACTIVE', 'VACATION', 'SUSPENDED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      
      const employees = await employeeService.getEmployeesByStatus(status);
      res.json(employees);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /employees/search - Buscar empleados
   * Solo ADMIN
   */
  async searchEmployees(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Parámetro de búsqueda requerido' 
        });
      }
      
      const employees = await employeeService.searchEmployees(q.trim());
      res.json(employees);
      
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /employees/departments - Obtener departamentos
   * Solo ADMIN
   */
  async getAllDepartments(req, res, next) {
    try {
      const departments = await employeeService.getAllDepartments();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /employees/positions - Obtener cargos
   * Solo ADMIN
   */
  async getAllPositions(req, res, next) {
    try {
      const positions = await employeeService.getAllPositions();
      res.json(positions);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /employees/stats - Obtener estadísticas
   * Solo ADMIN
   */
  async getEmployeeStats(req, res, next) {
    try {
      const stats = await employeeService.getEmployeeStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * DELETE /employees/:id - Desactivar empleado
   * Solo ADMIN
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const result = await employeeService.deleteEmployee(id);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Empleado no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
  
  /**
   * PATCH /employees/:id/status - Cambiar estado del empleado
   * Solo ADMIN
   */
  async changeEmployeeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Estado es requerido' });
      }
      
      const result = await employeeService.changeEmployeeStatus(id, status);
      
      res.json(result);
      
    } catch (error) {
      if (error.message === 'Empleado no encontrado' ||
          error.message === 'Estado inválido') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new EmployeeController();