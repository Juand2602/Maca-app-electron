// backend/src/services/saleService.js
const prisma = require('../config/database');

class SaleService {
  
  /**
   * Crear venta con items y pagos
   */
  async createSale(data, userId, warehouse) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // Validar que hay items
    if (!data.items || data.items.length === 0) {
      throw new Error('Debe incluir al menos un item');
    }
    
    // Validar stock y obtener datos de productos DE LA MISMA BODEGA
    const itemsWithProducts = [];
    
    for (const itemData of data.items) {
      // Obtener producto DE LA MISMA BODEGA
      const product = await prisma.product.findFirst({
        where: { 
          id: parseInt(itemData.productId),
          warehouse: warehouse // NUEVO: Solo productos de esta bodega
        },
        include: {
          stocks: {
            where: { size: itemData.size }
          }
        }
      });
      
      if (!product) {
        throw new Error(`Producto no encontrado en esta bodega: ${itemData.productId}`);
      }
      
      if (!product.isActive) {
        throw new Error(`El producto ${product.name} no está activo`);
      }
      
      // Verificar stock de la talla
      const stock = product.stocks.find(s => s.size === itemData.size);
      
      if (!stock) {
        throw new Error(
          `No hay stock para la talla ${itemData.size} del producto ${product.name}`
        );
      }
      
      const availableQuantity = stock.quantity - stock.reservedQuantity;
      
      if (availableQuantity < itemData.quantity) {
        throw new Error(
          `Stock insuficiente para ${product.name} talla ${itemData.size}. ` +
          `Disponible: ${availableQuantity}, Solicitado: ${itemData.quantity}`
        );
      }
      
      itemsWithProducts.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        size: itemData.size,
        quantity: itemData.quantity,
        unitPrice: product.salePrice,
        stockId: stock.id
      });
    }
    
    // Calcular subtotal de items
    const subtotal = itemsWithProducts.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);
    
    const discount = data.discount ? parseFloat(data.discount) : 0;
    const tax = data.tax ? parseFloat(data.tax) : 0;
    const total = subtotal - discount + tax;
    
    // Validar pagos
    let payments = data.payments || [];
    
    if (payments.length === 0 && data.paymentMethod) {
      payments = [{
        paymentMethod: data.paymentMethod,
        amount: total
      }];
    }
    
    if (payments.length === 0) {
      throw new Error('Debe especificar al menos un método de pago');
    }
    
    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    if (totalPayments < total) {
      throw new Error(
        `Los pagos no cubren el total. Total: ${total}, Pagos: ${totalPayments}`
      );
    }
    
    // Generar número de venta
    const saleNumber = await this.generateSaleNumber(warehouse);
    
    // Crear venta con items y pagos en transacción
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          user: {
            connect: { id: parseInt(userId) }
          },
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          subtotal,
          discount,
          tax,
          total,
          warehouse: warehouse, // NUEVO: Asignar bodega
          status: 'COMPLETED',
          notes: data.notes,
          items: {
            create: itemsWithProducts.map(item => ({
              productId: item.productId,
              size: item.size,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.unitPrice * item.quantity
            }))
          },
          payments: {
            create: payments.map(p => ({
              paymentMethod: p.paymentMethod,
              amount: parseFloat(p.amount),
              reference: p.referenceNumber,
              notes: p.notes
            }))
          }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          payments: true
        }
      });
      
      // Actualizar stock de cada producto
      for (const item of itemsWithProducts) {
        await tx.productStock.update({
          where: { id: item.stockId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }
      
      return newSale;
    });
    
    return this.mapToResponse(sale);
  }
  
  /**
   * Obtener venta por ID
   */
  async getSaleById(id, warehouse) {
    const sale = await prisma.sale.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        payments: true
      }
    });
    
    if (!sale) {
      throw new Error('Venta no encontrada en esta bodega');
    }
    
    return this.mapToResponse(sale);
  }
  
  /**
   * Obtener venta por número
   */
  async getSaleBySaleNumber(saleNumber, warehouse) {
    const sale = await prisma.sale.findFirst({
      where: { 
        saleNumber,
        warehouse: warehouse // NUEVO: Filtrar por bodega
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        payments: true
      }
    });
    
    if (!sale) {
      throw new Error('Venta no encontrada en esta bodega');
    }
    
    return this.mapToResponse(sale);
  }
  
  /**
   * Listar todas las ventas
   */
  async getAllSales(warehouse) {
    const sales = await prisma.sale.findMany({
      where: { warehouse: warehouse }, // NUEVO: Filtrar por bodega
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return sales.map(s => this.mapToResponse(s));
  }
  
  /**
   * Listar ventas con paginación
   */
  async getAllSalesPaginated(page = 1, limit = 10, warehouse) {
    const skip = (page - 1) * limit;
    
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { warehouse: warehouse }, // NUEVO: Filtrar por bodega
        skip,
        take: limit,
        include: {
          user: {
            select: {
              username: true,
              fullName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          },
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.sale.count({
        where: { warehouse: warehouse } // NUEVO: Contar solo de esta bodega
      })
    ]);
    
    return {
      data: sales.map(s => this.mapToResponse(s)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Ventas por rango de fechas
   */
  async getSalesByDateRange(startDate, endDate, warehouse) {
    const sales = await prisma.sale.findMany({
      where: {
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return sales.map(s => this.mapToResponse(s));
  }
  
  /**
   * Buscar ventas
   */
  async searchSales(searchTerm, warehouse) {
    const sales = await prisma.sale.findMany({
      where: {
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        OR: [
          { saleNumber: { contains: searchTerm, mode: 'insensitive' } },
          { customerName: { contains: searchTerm, mode: 'insensitive' } },
          { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
          { customerPhone: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return sales.map(s => this.mapToResponse(s));
  }
  
  /**
   * Total de ventas por rango de fechas
   */
  async getTotalSalesByDateRange(startDate, endDate, warehouse) {
    const result = await prisma.sale.aggregate({
      where: {
        status: 'COMPLETED',
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      _sum: {
        total: true
      }
    });
    
    return result._sum.total || 0;
  }
  
  /**
   * Contar ventas por rango de fechas
   */
  async countSalesByDateRange(startDate, endDate, warehouse) {
    return await prisma.sale.count({
      where: {
        status: 'COMPLETED',
        warehouse: warehouse, // NUEVO: Filtrar por bodega
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });
  }
  
  /**
   * Cancelar venta y devolver stock
   */
  async cancelSale(id, warehouse) {
    const sale = await prisma.sale.findFirst({
      where: { 
        id: parseInt(id),
        warehouse: warehouse // NUEVO: Verificar bodega
      },
      include: {
        items: true
      }
    });
    
    if (!sale) {
      throw new Error('Venta no encontrada en esta bodega');
    }
    
    if (sale.status === 'CANCELLED') {
      throw new Error('La venta ya está cancelada');
    }
    
    // Devolver stock y cancelar venta en transacción
    await prisma.$transaction(async (tx) => {
      // Devolver stock de cada item
      for (const item of sale.items) {
        const stock = await tx.productStock.findFirst({
          where: {
            productId: item.productId,
            size: item.size
          }
        });
        
        if (stock) {
          await tx.productStock.update({
            where: { id: stock.id },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        }
      }
      
      // Actualizar estado de la venta
      await tx.sale.update({
        where: { id: parseInt(id) },
        data: { status: 'CANCELLED' }
      });
    });
    
    return { message: 'Venta cancelada exitosamente' };
  }
  
  /**
   * Generar número de venta único POR BODEGA
   */
  async generateSaleNumber(warehouse) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const warehousePrefix = warehouse === 'Centro' ? 'CEN' : 'SF';
    const prefix = `VEN-${warehousePrefix}-${dateStr}`;
    
    const count = await prisma.sale.count({
      where: {
        warehouse: warehouse, // NUEVO: Contar solo de esta bodega
        saleNumber: {
          startsWith: prefix
        }
      }
    });
    
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  
  /**
   * Mapear Sale a SaleResponse
   */
  mapToResponse(sale) {
    const totalItems = sale.items 
      ? sale.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
    
    const isMixedPayment = sale.payments && sale.payments.length > 1;
    
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      userName: sale.user?.username || sale.user?.fullName,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerPhone: sale.customerPhone,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      warehouse: sale.warehouse, // NUEVO: Incluir bodega en respuesta
      status: sale.status,
      notes: sale.notes,
      totalItems,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: sale.items ? sale.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Producto eliminado',
        productCode: item.product?.code || 'N/A',
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })) : [],
      payments: sale.payments ? sale.payments.map(payment => ({
        id: payment.id,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        reference: payment.reference,
        notes: payment.notes,
        createdAt: payment.createdAt
      })) : [],
      isMixedPayment
    };
  }
}

module.exports = new SaleService();