// backend/src/services/providerService.js
const prisma = require('../config/database');

class ProviderService {
  
  /**
   * Crear proveedor
   */
  async createProvider(data, warehouse) {
    // Verificar documento único EN LA MISMA BODEGA
    const existingProvider = await prisma.provider.findFirst({
      where: { 
        document: data.document,
        warehouse: warehouse // NUEVO: Verificar en la misma bodega
      }
    });
    
    if (existingProvider) {
      throw new Error('El documento del proveedor ya existe en esta bodega');
    }
    
    // Crear proveedor
    const provider = await prisma.provider.create({
      data: {
        document: data.document,
        name: data.name,
        businessName: data.businessName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        country: data.country,
        paymentTerms: data.paymentTerms,
        paymentDays: data.paymentDays ? parseInt(data.paymentDays) : null,
        warehouse: warehouse, // NUEVO: Asignar bodega
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes
      }
    });
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Actualizar proveedor
   */
  async updateProvider(id, data, warehouse) {
    const providerId = parseInt(id);
    
    // Verificar que existe el proveedor EN LA MISMA BODEGA
    const existingProvider = await prisma.provider.findFirst({
      where: { 
        id: providerId,
        warehouse: warehouse // NUEVO: Verificar bodega
      }
    });
    
    if (!existingProvider) {
      throw new Error('Proveedor no encontrado en esta bodega');
    }
    
    // Verificar documento único si cambió EN LA MISMA BODEGA
    if (data.document && data.document !== existingProvider.document) {
      const duplicateDocument = await prisma.provider.findFirst({
        where: { 
          document: data.document,
          warehouse: warehouse,
          id: { not: providerId }
        }
      });
      
      if (duplicateDocument) {
        throw new Error('El documento del proveedor ya existe en esta bodega');
      }
    }
    
    // Actualizar proveedor
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        document: data.document,
        name: data.name,
        businessName: data.businessName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        country: data.country,
        paymentTerms: data.paymentTerms,
        paymentDays: data.paymentDays ? parseInt(data.paymentDays) : null,
        isActive: data.isActive,
        notes: data.notes
      }
    });
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Obtener proveedor por ID
   */
  async getProviderById(id, warehouse) {
    const provider = await prisma.provider.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Filtrar por bodega
      }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado en esta bodega');
    }
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Obtener proveedor por documento
   */
  async getProviderByDocument(document, warehouse) {
    const provider = await prisma.provider.findFirst({
      where: { 
        document,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado en esta bodega');
    }
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Listar todos los proveedores
   */
  async getAllProviders(warehouse) {
    const providers = await prisma.provider.findMany({
      where: { warehouse: warehouse }, // NUEVO: Filtrar por bodega
      orderBy: {
        name: 'asc'
      }
    });
    
    return providers.map(p => this.mapToResponse(p));
  }
  
  /**
   * Listar proveedores con paginación
   */
  async getAllProvidersPaginated(page = 1, limit = 10, warehouse) {
    const skip = (page - 1) * limit;
    
    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where: { warehouse: warehouse }, // NUEVO: Filtrar por bodega
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.provider.count({
        where: { warehouse: warehouse } // NUEVO: Contar solo de esta bodega
      })
    ]);
    
    return {
      data: providers.map(p => this.mapToResponse(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Listar proveedores activos
   */
  async getActiveProviders(warehouse) {
    const providers = await prisma.provider.findMany({
      where: { 
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return providers.map(p => this.mapToResponse(p));
  }
  
  /**
   * Buscar proveedores
   */
  async searchProviders(searchTerm, warehouse) {
    const providers = await prisma.provider.findMany({
      where: {
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { businessName: { contains: searchTerm, mode: 'insensitive' } },
          { document: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return providers.map(p => this.mapToResponse(p));
  }
  
  /**
   * Obtener todas las ciudades únicas
   */
  async getAllCities(warehouse) {
    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        city: { not: null }
      },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' }
    });
    
    return providers.map(p => p.city).filter(Boolean);
  }
  
  /**
   * Obtener todos los países únicos
   */
  async getAllCountries(warehouse) {
    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        country: { not: null }
      },
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' }
    });
    
    return providers.map(p => p.country).filter(Boolean);
  }
  
  /**
   * Desactivar proveedor (soft delete)
   */
  async deleteProvider(id, warehouse) {
    const provider = await prisma.provider.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Verificar bodega
      }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado en esta bodega');
    }
    
    await prisma.provider.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    return { message: 'Proveedor desactivado exitosamente' };
  }
  
  /**
   * Activar proveedor
   */
  async activateProvider(id, warehouse) {
    const provider = await prisma.provider.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Verificar bodega
      }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado en esta bodega');
    }
    
    await prisma.provider.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });
    
    return { message: 'Proveedor activado exitosamente' };
  }
  
  /**
   * Mapear Provider a ProviderResponse
   */
  mapToResponse(provider) {
    return {
      id: provider.id,
      document: provider.document,
      name: provider.name,
      businessName: provider.businessName,
      contactName: provider.contactName,
      email: provider.email,
      phone: provider.phone,
      mobile: provider.mobile,
      address: provider.address,
      city: provider.city,
      country: provider.country,
      paymentTerms: provider.paymentTerms,
      paymentDays: provider.paymentDays,
      warehouse: provider.warehouse, // NUEVO: Incluir bodega en respuesta
      isActive: provider.isActive,
      notes: provider.notes,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    };
  }
}

module.exports = new ProviderService();