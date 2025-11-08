// backend/src/services/providerService.js
const prisma = require('../config/database');

class ProviderService {
  
  /**
   * Crear proveedor
   */
  async createProvider(data) {
    // Verificar documento único
    const existingProvider = await prisma.provider.findUnique({
      where: { document: data.document }
    });
    
    if (existingProvider) {
      throw new Error('El documento del proveedor ya existe');
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
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes
      }
    });
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Actualizar proveedor
   */
  async updateProvider(id, data) {
    const providerId = parseInt(id);
    
    // Verificar que existe el proveedor
    const existingProvider = await prisma.provider.findUnique({
      where: { id: providerId }
    });
    
    if (!existingProvider) {
      throw new Error('Proveedor no encontrado');
    }
    
    // Verificar documento único si cambió
    if (data.document && data.document !== existingProvider.document) {
      const duplicateDocument = await prisma.provider.findUnique({
        where: { document: data.document }
      });
      
      if (duplicateDocument) {
        throw new Error('El documento del proveedor ya existe');
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
  async getProviderById(id) {
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado');
    }
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Obtener proveedor por documento
   */
  async getProviderByDocument(document) {
    const provider = await prisma.provider.findUnique({
      where: { document }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado');
    }
    
    return this.mapToResponse(provider);
  }
  
  /**
   * Listar todos los proveedores
   */
  async getAllProviders() {
    const providers = await prisma.provider.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return providers.map(p => this.mapToResponse(p));
  }
  
  /**
   * Listar proveedores con paginación
   */
  async getAllProvidersPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.provider.count()
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
  async getActiveProviders() {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      orderBy: {
        name: 'asc'
      }
    });
    
    return providers.map(p => this.mapToResponse(p));
  }
  
  /**
   * Buscar proveedores
   */
  async searchProviders(searchTerm) {
    const providers = await prisma.provider.findMany({
      where: {
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
  async getAllCities() {
    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
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
  async getAllCountries() {
    const providers = await prisma.provider.findMany({
      where: {
        isActive: true,
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
  async deleteProvider(id) {
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado');
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
  async activateProvider(id) {
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado');
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
      isActive: provider.isActive,
      notes: provider.notes,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    };
  }
}

module.exports = new ProviderService();