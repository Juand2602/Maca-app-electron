// backend/src/services/productService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProductService {
  
  /**
   * Crear producto con stocks
   */
  async createProduct(data) {
    // Verificar código único
    const existingProduct = await prisma.product.findUnique({
      where: { code: data.code }
    });
    
    if (existingProduct) {
      throw new Error('El código del producto ya existe');
    }
    
    // Crear producto con stocks en transacción
    const product = await prisma.$transaction(async (tx) => {
      // Crear producto
      const newProduct = await tx.product.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          brand: data.brand,
          category: data.category,
          color: data.color,
          material: data.material,
          purchasePrice: parseFloat(data.purchasePrice),
          salePrice: parseFloat(data.salePrice),
          minStock: data.minStock || 5,
          isActive: data.isActive !== undefined ? data.isActive : true,
          // Crear stocks si existen
          stocks: {
            create: (data.stocks || []).map(stock => ({
              size: stock.size,
              quantity: stock.quantity || 0,
              reservedQuantity: 0
            }))
          }
        },
        include: {
          stocks: true
        }
      });
      
      return newProduct;
    });
    
    return this.mapToResponse(product);
  }
  
  /**
   * Actualizar producto con stocks
   */
  async updateProduct(id, data) {
    const productId = parseInt(id);
    
    // Verificar que existe el producto
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { stocks: true }
    });
    
    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }
    
    // Verificar código único si cambió
    if (data.code && data.code !== existingProduct.code) {
      const duplicateCode = await prisma.product.findUnique({
        where: { code: data.code }
      });
      
      if (duplicateCode) {
        throw new Error('El código del producto ya existe');
      }
    }
    
    // Actualizar producto y stocks en transacción
    const product = await prisma.$transaction(async (tx) => {
      // Actualizar datos del producto
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          brand: data.brand,
          category: data.category,
          color: data.color,
          material: data.material,
          purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
          salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
          minStock: data.minStock,
          isActive: data.isActive
        }
      });
      
      // Si vienen stocks en el request, actualizarlos
      if (data.stocks && Array.isArray(data.stocks)) {
        // Crear un mapa de stocks existentes por talla
        const existingStocksMap = new Map(
          existingProduct.stocks.map(s => [s.size, s])
        );
        
        // Procesar cada stock del request
        for (const stockData of data.stocks) {
          const existingStock = existingStocksMap.get(stockData.size);
          
          if (existingStock) {
            // Actualizar stock existente
            await tx.productStock.update({
              where: { id: existingStock.id },
              data: {
                quantity: stockData.quantity || 0
                // No tocamos reservedQuantity
              }
            });
          } else {
            // Crear nuevo stock
            await tx.productStock.create({
              data: {
                productId: productId,
                size: stockData.size,
                quantity: stockData.quantity || 0,
                reservedQuantity: 0
              }
            });
          }
        }
        
        // Opcional: Eliminar stocks que no están en el request
        const requestSizes = data.stocks.map(s => s.size);
        const stocksToDelete = existingProduct.stocks.filter(
          s => !requestSizes.includes(s.size)
        );
        
        for (const stock of stocksToDelete) {
          // Solo eliminar si no tiene cantidad reservada
          if (stock.reservedQuantity === 0) {
            await tx.productStock.delete({
              where: { id: stock.id }
            });
          }
        }
      }
      
      // Retornar producto actualizado con stocks
      return await tx.product.findUnique({
        where: { id: productId },
        include: { stocks: true }
      });
    });
    
    return this.mapToResponse(product);
  }
  
  /**
   * Obtener producto por ID
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        stocks: {
          orderBy: { size: 'asc' }
        }
      }
    });
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    return this.mapToResponse(product);
  }
  
  /**
   * Listar todos los productos
   */
  async getAllProducts() {
    const products = await prisma.product.findMany({
      include: {
        stocks: {
          orderBy: { size: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return products.map(p => this.mapToResponse(p));
  }
  
  /**
   * Listar productos con paginación
   */
  async getAllProductsPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        include: {
          stocks: {
            orderBy: { size: 'asc' }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count()
    ]);
    
    return {
      data: products.map(p => this.mapToResponse(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Listar productos activos
   */
  async getActiveProducts() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stocks: {
          orderBy: { size: 'asc' }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return products.map(p => this.mapToResponse(p));
  }
  
  /**
   * Buscar productos
   */
  async searchProducts(searchTerm) {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        stocks: {
          orderBy: { size: 'asc' }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return products.map(p => this.mapToResponse(p));
  }
  
  /**
   * Productos con stock bajo
   */
  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        stocks: true
      }
    });
    
    // Filtrar productos con stock total <= minStock
    const lowStockProducts = products.filter(product => {
      const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      return totalStock <= product.minStock;
    });
    
    return lowStockProducts.map(p => this.mapToResponse(p));
  }
  
  /**
   * Obtener todas las categorías únicas
   */
  async getAllCategories() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });
    
    return products.map(p => p.category).filter(Boolean);
  }
  
  /**
   * Obtener todas las marcas únicas
   */
  async getAllBrands() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' }
    });
    
    return products.map(p => p.brand).filter(Boolean);
  }
  
  /**
   * Obtener todos los materiales únicos
   */
  async getAllMaterials() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { material: true },
      distinct: ['material'],
      orderBy: { material: 'asc' }
    });
    
    return products.map(p => p.material).filter(Boolean);
  }
  
  /**
   * Obtener todos los colores únicos
   */
  async getAllColors() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { color: true },
      distinct: ['color'],
      orderBy: { color: 'asc' }
    });
    
    return products.map(p => p.color).filter(Boolean);
  }
  
  /**
   * Desactivar producto (soft delete)
   */
  async deleteProduct(id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    return { message: 'Producto desactivado exitosamente' };
  }
  
  /**
   * Activar producto
   */
  async activateProduct(id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });
    
    return { message: 'Producto activado exitosamente' };
  }
  
  /**
   * Mapear Product a ProductResponse
   */
  mapToResponse(product) {
    const totalStock = product.stocks 
      ? product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
      : 0;
    
    const isLowStock = totalStock <= product.minStock;
    
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      color: product.color,
      material: product.material,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      minStock: product.minStock,
      totalStock,
      isActive: product.isActive,
      isLowStock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      stocks: product.stocks ? product.stocks.map(stock => ({
        id: stock.id,
        size: stock.size,
        quantity: stock.quantity,
        reservedQuantity: stock.reservedQuantity,
        availableQuantity: stock.quantity - stock.reservedQuantity
      })) : []
    };
  }
}

module.exports = new ProductService();