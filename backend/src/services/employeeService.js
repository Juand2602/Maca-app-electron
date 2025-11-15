// backend/src/services/employeeService.js
const prisma = require('../config/database');

class EmployeeService {
  
  /**
   * Crear empleado
   */
  async createEmployee(data) {
    // Verificar documento único
    const existingByDocument = await prisma.employee.findUnique({
      where: { document: data.document }
    });
    
    if (existingByDocument) {
      throw new Error('El documento del empleado ya existe');
    }
    
    // Verificar email único
    const existingByEmail = await prisma.employee.findUnique({
      where: { email: data.email }
    });
    
    if (existingByEmail) {
      throw new Error('El email del empleado ya existe');
    }
    
    // Vincular usuario si se proporciona
    let userId = null;
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(data.userId) }
      });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verificar que el usuario no esté asignado a otro empleado
      const userAlreadyAssigned = await prisma.employee.findFirst({
        where: { user: { id: parseInt(data.userId) } }
      });
      
      if (userAlreadyAssigned) {
        throw new Error('Este usuario ya está asignado a otro empleado');
      }

      // CORREGIDO: Actualizar rol y comisión en la tabla User
      await prisma.user.update({
        where: { id: parseInt(data.userId) },
        data: {
          role: data.role || user.role, // Si se proporciona un nuevo rol, lo actualiza
          commissionRate: parseFloat(data.commissionRate) // CORREGIDO: Actualizar comisión
        }
      });
      
      userId = parseInt(data.userId);
    }
    
    // Crear empleado
    const employee = await prisma.employee.create({
      data: {
        document: data.document,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        address: data.address,
        city: data.city,
        department: data.department,
        phone: data.phone,
        email: data.email,
        position: data.position,
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
        salary: data.salary ? parseFloat(data.salary) : null,
        workSchedule: data.workSchedule,
        contractType: data.contractType,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        status: data.status || 'ACTIVE',
        notes: data.notes,
        ...(userId && {
          user: {
            connect: { id: userId }
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      }
    });
    
    return this.mapToResponse(employee);
  }
  
  /**
   * Actualizar empleado
   */
  async updateEmployee(id, data) {
    const employeeId = parseInt(id);
    
    // Verificar que existe el empleado
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true } // CORREGIDO: Incluir usuario para verificar datos existentes
    });
    
    if (!existingEmployee) {
      throw new Error('Empleado no encontrado');
    }
    
    // Verificar documento único si cambió
    if (data.document && data.document !== existingEmployee.document) {
      const duplicateDocument = await prisma.employee.findUnique({
        where: { document: data.document }
      });
      
      if (duplicateDocument) {
        throw new Error('El documento del empleado ya existe');
      }
    }
    
    // Verificar email único si cambió
    if (data.email && data.email !== existingEmployee.email) {
      const duplicateEmail = await prisma.employee.findUnique({
        where: { email: data.email }
      });
      
      if (duplicateEmail) {
        throw new Error('El email del empleado ya existe');
      }
    }
    
    // Preparar datos de actualización
    const updateData = {
      document: data.document,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      address: data.address,
      city: data.city,
      department: data.department,
      phone: data.phone,
      email: data.email,
      position: data.position,
      hireDate: data.hireDate ? new Date(data.hireDate) : null,
      salary: data.salary ? parseFloat(data.salary) : null,
      workSchedule: data.workSchedule,
      contractType: data.contractType,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      emergencyContactRelationship: data.emergencyContactRelationship,
      status: data.status,
      notes: data.notes
    };
    
    // CORREGIDO: Manejar relación con usuario y sus datos
    if (data.userId !== undefined) {
      if (data.userId === null) {
        // Desvincular usuario
        updateData.user = { disconnect: true };
      } else {
        // Vincular nuevo usuario o actualizar el existente
        const user = await prisma.user.findUnique({
          where: { id: parseInt(data.userId) }
        });
        
        if (!user) {
          throw new Error('Usuario no encontrado');
        }
        
        // CORREGIDO: Actualizar rol y comisión en la tabla User
        await prisma.user.update({
          where: { id: parseInt(data.userId) },
          data: {
            role: data.role || user.role, // Si se proporciona un nuevo rol, lo actualiza
            commissionRate: parseFloat(data.commissionRate) // CORREGIDO: Actualizar comisión
          }
        });

        updateData.user = { connect: { id: parseInt(data.userId) } };
      }
    } else if (existingEmployee.user) {
      // Si no se cambia el userId pero el empleado tiene un usuario, actualizamos sus datos
      // CORREGIDO: Actualizar rol y comisión si se proporcionan en los datos
      if (data.role !== undefined || data.commissionRate !== undefined) {
        await prisma.user.update({
          where: { id: existingEmployee.user.id },
          data: {
            ...(data.role && { role: data.role }),
            ...(data.commissionRate !== undefined && { commissionRate: parseFloat(data.commissionRate) })
          }
        });
      }
    }
    
    // Actualizar empleado
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      }
    });
    
    return this.mapToResponse(employee);
  }
  
  /**
   * Obtener empleado por ID
   */
  async getEmployeeById(id) {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      }
    });
    
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    
    return this.mapToResponse(employee);
  }
  
  /**
   * Obtener empleado por documento
   */
  async getEmployeeByDocument(document) {
    const employee = await prisma.employee.findUnique({
      where: { document },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      }
    });
    
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    
    return this.mapToResponse(employee);
  }
  
  /**
   * Listar todos los empleados
   */
  async getAllEmployees() {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    return employees.map(e => this.mapToResponse(e));
  }
  
  /**
   * Listar empleados con paginación
   */
  async getAllEmployeesPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true, // CORREGIDO: Incluir rol en la respuesta
              commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
            }
          }
        },
        orderBy: {
          firstName: 'asc'
        }
      }),
      prisma.employee.count()
    ]);
    
    return {
      data: employees.map(e => this.mapToResponse(e)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Empleados por estado
   */
  async getEmployeesByStatus(status) {
    const employees = await prisma.employee.findMany({
      where: { status: status.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    return employees.map(e => this.mapToResponse(e));
  }
  
  /**
   * Buscar empleados
   */
  async searchEmployees(searchTerm) {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { document: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true, // CORREGIDO: Incluir rol en la respuesta
            commissionRate: true // CORREGIDO: Incluir comisión en la respuesta
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });
    
    return employees.map(e => this.mapToResponse(e));
  }
  
  /**
   * Obtener todos los departamentos únicos
   */
  async getAllDepartments() {
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        department: { not: null }
      },
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' }
    });
    
    return employees.map(e => e.department).filter(Boolean);
  }
  
  /**
   * Obtener todos los cargos únicos
   */
  async getAllPositions() {
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        position: { not: null }
      },
      select: { position: true },
      distinct: ['position'],
      orderBy: { position: 'asc' }
    });
    
    return employees.map(e => e.position).filter(Boolean);
  }
  
  /**
   * Contar empleados por estado
   */
  async countByStatus(status) {
    return await prisma.employee.count({
      where: { status: status.toUpperCase() }
    });
  }
  
  /**
   * Obtener estadísticas de empleados
   */
  async getEmployeeStats() {
    const [active, inactive, vacation, suspended, total] = await Promise.all([
      this.countByStatus('ACTIVE'),
      this.countByStatus('INACTIVE'),
      this.countByStatus('VACATION'),
      this.countByStatus('SUSPENDED'),
      prisma.employee.count()
    ]);
    
    return {
      active,
      inactive,
      vacation,
      suspended,
      total
    };
  }
  
  /**
   * Desactivar empleado
   */
  async deleteEmployee(id) {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    
    await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { status: 'INACTIVE' }
    });
    
    return { message: 'Empleado desactivado exitosamente' };
  }
  
  /**
   * Cambiar estado del empleado
   */
  async changeEmployeeStatus(id, status) {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    
    const validStatuses = ['ACTIVE', 'INACTIVE', 'VACATION', 'SUSPENDED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new Error('Estado inválido');
    }
    
    await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { status: status.toUpperCase() }
    });
    
    return { message: 'Estado actualizado exitosamente' };
  }
  
  /**
   * Mapear Employee a EmployeeResponse
   */
  mapToResponse(employee) {
    return {
      id: employee.id,
      document: employee.document,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      birthDate: employee.birthDate,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      address: employee.address,
      city: employee.city,
      department: employee.department,
      phone: employee.phone,
      email: employee.email,
      position: employee.position,
      hireDate: employee.hireDate,
      salary: employee.salary,
      workSchedule: employee.workSchedule,
      contractType: employee.contractType,
      emergencyContactName: employee.emergencyContactName,
      emergencyContactPhone: employee.emergencyContactPhone,
      emergencyContactRelationship: employee.emergencyContactRelationship,
      status: employee.status,
      notes: employee.notes,
      userId: employee.user?.id || null,
      username: employee.user?.username || null,
      role: employee.user?.role || null, // CORREGIDO: Incluir rol en la respuesta
      commissionRate: employee.user?.commissionRate || 5.0, // CORREGIDO: Incluir comisión en la respuesta
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    };
  }
}

module.exports = new EmployeeService();