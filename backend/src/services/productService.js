// backend/src/services/productService.js
const prisma = require('../config/database');

class ProductService {
  
  /**
   * Crear producto con stocks
   */
  async createProduct(data, warehouse) {
    // Verificar código único EN LA MISMA BODEGA
    const existingProduct = await prisma.product.findFirst({
      where: { 
        code: data.code,
        warehouse: warehouse // NUEVO: Verificar en la misma bodega
      }
    });
    
    if (existingProduct) {
      throw new Error('El código del producto ya existe en esta bodega');
    }
    
    // Crear producto con stocks en transacción
    const product = await prisma.$transaction(async (tx) => {
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
          warehouse: warehouse, // NUEVO: Asignar bodega
          isActive: data.isActive !== undefined ? data.isActive : true,
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
  async updateProduct(id, data, warehouse) {
    const productId = parseInt(id);
    
    // Verificar que existe el producto EN LA MISMA BODEGA
    const existingProduct = await prisma.product.findFirst({
      where: { 
        id: productId,
        warehouse: warehouse // NUEVO: Verificar bodega
      },
      include: { stocks: true }
    });
    
    if (!existingProduct) {
      throw new Error('Producto no encontrado en esta bodega');
    }
    
    // Verificar código único si cambió EN LA MISMA BODEGA
    if (data.code && data.code !== existingProduct.code) {
      const duplicateCode = await prisma.product.findFirst({
        where: { 
          code: data.code,
          warehouse: warehouse,
          id: { not: productId }
        }
      });
      
      if (duplicateCode) {
        throw new Error('El código del producto ya existe en esta bodega');
      }
    }
    
    // Actualizar producto y stocks en transacción
    const product = await prisma.$transaction(async (tx) => {
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
      
      if (data.stocks && Array.isArray(data.stocks)) {
        const existingStocksMap = new Map(
          existingProduct.stocks.map(s => [s.size, s])
        );
        
        for (const stockData of data.stocks) {
          const existingStock = existingStocksMap.get(stockData.size);
          
          if (existingStock) {
            await tx.productStock.update({
              where: { id: existingStock.id },
              data: {
                quantity: stockData.quantity || 0
              }
            });
          } else {
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
        
        const requestSizes = data.stocks.map(s => s.size);
        const stocksToDelete = existingProduct.stocks.filter(
          s => !requestSizes.includes(s.size)
        );
        
        for (const stock of stocksToDelete) {
          if (stock.reservedQuantity === 0) {
            await tx.productStock.delete({
              where: { id: stock.id }
            });
          }
        }
      }
      
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
  async getProductById(id, warehouse) {
    const product = await prisma.product.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      include: {
        stocks: {
          orderBy: { size: 'asc' }
        }
      }
    });
    
    if (!product) {
      throw new Error('Producto no encontrado en esta bodega');
    }
    
    return this.mapToResponse(product);
  }
  
  /**
   * Listar todos los productos
   */
  async getAllProducts(warehouse) {
    const products = await prisma.product.findMany({
      where: { warehouse: warehouse }, // NUEVO: Filtrar por bodega
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
  async getAllProductsPaginated(page = 1, limit = 10, warehouse) {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { warehouse: warehouse }, // NUEVO: Filtrar por bodega
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
      prisma.product.count({
        where: { warehouse: warehouse } // NUEVO: Contar solo de esta bodega
      })
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
  async getActiveProducts(warehouse) {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
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
   * Buscar productos
   */
  async searchProducts(searchTerm, warehouse) {
    const products = await prisma.product.findMany({
      where: {
        warehouse: warehouse, // NUEVO: Filtrar por bodega
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
  async getLowStockProducts(warehouse) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      include: {
        stocks: true
      }
    });
    
    const lowStockProducts = products.filter(product => {
      const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      return totalStock <= product.minStock;
    });
    
    return lowStockProducts.map(p => this.mapToResponse(p));
  }
  
  /**
   * Obtener todas las categorías únicas
   */
  async getAllCategories(warehouse) {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });
    
    return products.map(p => p.category).filter(Boolean);
  }
  
  /**
   * Obtener todas las marcas únicas
   */
  async getAllBrands(warehouse) {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' }
    });
    
    return products.map(p => p.brand).filter(Boolean);
  }
  
  /**
   * Obtener todos los materiales únicos
   */
  async getAllMaterials(warehouse) {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      select: { material: true },
      distinct: ['material'],
      orderBy: { material: 'asc' }
    });
    
    return products.map(p => p.material).filter(Boolean);
  }
  
  /**
   * Obtener todos los colores únicos
   */
  async getAllColors(warehouse) {
    const products = await prisma.product.findMany({
      where: { 
        isActive: true,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      select: { color: true },
      distinct: ['color'],
      orderBy: { color: 'asc' }
    });
    
    return products.map(p => p.color).filter(Boolean);
  }
  
  /**
   * Desactivar producto (soft delete)
   */
  async deleteProduct(id, warehouse) {
    const product = await prisma.product.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Verificar bodega
      }
    });
    
    if (!product) {
      throw new Error('Producto no encontrado en esta bodega');
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
  async activateProduct(id, warehouse) {
    const product = await prisma.product.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Verificar bodega
      }
    });
    
    if (!product) {
      throw new Error('Producto no encontrado en esta bodega');
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
    imageUrl: product.imageUrl, // NUEVO: Incluir URL de imagen
    purchasePrice: product.purchasePrice,
    salePrice: product.salePrice,
    minStock: product.minStock,
    warehouse: product.warehouse,
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