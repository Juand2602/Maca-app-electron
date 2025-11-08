// backend/src/services/invoiceService.js
const prisma = require('../config/database');

class InvoiceService {
  
  /**
   * Crear factura
   */
  async createInvoice(data, userId) {
    // Verificar que el proveedor existe
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(data.providerId) }
    });
    
    if (!provider) {
      throw new Error('Proveedor no encontrado');
    }
    
    // Verificar número de factura único
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: data.invoiceNumber }
    });
    
    if (existingInvoice) {
      throw new Error('El número de factura ya existe');
    }
    
    // Calcular balance inicial
    const subtotal = parseFloat(data.subtotal);
    const tax = data.tax ? parseFloat(data.tax) : 0;
    const discount = data.discount ? parseFloat(data.discount) : 0;
    const total = parseFloat(data.total);
    const balance = total;
    
    // Determinar estado inicial
    const status = this.determineStatus(0, balance, new Date(data.dueDate));
    
    // Crear factura
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        providerId: parseInt(data.providerId),
        userId: userId ? parseInt(userId) : null,
        invoiceDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        discount,
        total,
        status,
        notes: data.notes
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        payments: true
      }
    });
    
    return this.mapToResponse(invoice);
  }
  
  /**
   * Agregar pago a factura
   */
  async addPayment(data, userId) {
    // Verificar que la factura existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(data.invoiceId) },
      include: {
        payments: true,
        provider: true
      }
    });
    
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    
    // Calcular balance actual
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = invoice.total - paidAmount;
    
    // Validar que el pago no exceda el balance
    const paymentAmount = parseFloat(data.amount);
    
    if (paymentAmount > currentBalance) {
      throw new Error(
        `El monto del pago (${paymentAmount}) excede el balance pendiente (${currentBalance})`
      );
    }
    
    // Generar número de pago
    const paymentNumber = await this.generatePaymentNumber();
    
    // Crear pago y actualizar factura en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear pago
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: parseInt(data.invoiceId),
          paymentDate: new Date(data.paymentDate),
          amount: paymentAmount,
          paymentMethod: data.paymentMethod,
          reference: data.referenceNumber,
          notes: data.notes
        }
      });
      
      // Calcular nuevo balance
      const newPaidAmount = paidAmount + paymentAmount;
      const newBalance = invoice.total - newPaidAmount;
      
      // Determinar nuevo estado
      const newStatus = this.determineStatus(
        newPaidAmount,
        newBalance,
        invoice.dueDate
      );
      
      // Actualizar factura
      const updatedInvoice = await tx.invoice.update({
        where: { id: parseInt(data.invoiceId) },
        data: {
          status: newStatus
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              document: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          payments: true
        }
      });
      
      return { payment, invoice: updatedInvoice };
    });
    
    return {
      payment: this.mapPaymentToResponse(result.payment),
      invoice: this.mapToResponse(result.invoice)
    };
  }
  
  /**
   * Obtener factura por ID
   */
  async getInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });
    
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    
    return this.mapToResponse(invoice);
  }
  
  /**
   * Obtener factura por número
   */
  async getInvoiceByNumber(invoiceNumber) {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });
    
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    
    return this.mapToResponse(invoice);
  }
  
  /**
   * Listar todas las facturas
   */
  async getAllInvoices() {
    const invoices = await prisma.invoice.findMany({
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        payments: true
      },
      orderBy: {
        invoiceDate: 'desc'
      }
    });
    
    return invoices.map(i => this.mapToResponse(i));
  }
  
  /**
   * Listar facturas con paginación
   */
  async getAllInvoicesPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        skip,
        take: limit,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              document: true
            }
          },
          payments: true
        },
        orderBy: {
          invoiceDate: 'desc'
        }
      }),
      prisma.invoice.count()
    ]);
    
    return {
      data: invoices.map(i => this.mapToResponse(i)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Facturas por estado
   */
  async getInvoicesByStatus(status) {
    const invoices = await prisma.invoice.findMany({
      where: { status },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        payments: true
      },
      orderBy: {
        invoiceDate: 'desc'
      }
    });
    
    return invoices.map(i => this.mapToResponse(i));
  }
  
  /**
   * Facturas por proveedor
   */
  async getInvoicesByProvider(providerId) {
    const invoices = await prisma.invoice.findMany({
      where: { providerId: parseInt(providerId) },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        payments: true
      },
      orderBy: {
        invoiceDate: 'desc'
      }
    });
    
    return invoices.map(i => this.mapToResponse(i));
  }
  
  /**
   * Facturas vencidas
   */
  async getOverdueInvoices() {
    const today = new Date();
    
    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: {
          lt: today
        },
        status: {
          notIn: ['PAID', 'CANCELLED']
        }
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        payments: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    return invoices.map(i => this.mapToResponse(i));
  }
  
  /**
   * Facturas por rango de fechas
   */
  async getInvoicesByDateRange(startDate, endDate) {
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        payments: true
      },
      orderBy: {
        invoiceDate: 'desc'
      }
    });
    
    return invoices.map(i => this.mapToResponse(i));
  }
  
  /**
   * Total de facturas por estado
   */
  async getTotalByStatus(status) {
    const result = await prisma.invoice.aggregate({
      where: { status },
      _sum: {
        total: true
      }
    });
    
    return result._sum.total || 0;
  }
  
  /**
   * Balance pendiente total
   */
  async getTotalPendingBalance() {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          notIn: ['PAID', 'CANCELLED']
        }
      },
      include: {
        payments: true
      }
    });
    
    let totalBalance = 0;
    
    for (const invoice of invoices) {
      const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = invoice.total - paidAmount;
      totalBalance += balance;
    }
    
    return totalBalance;
  }
  
  /**
   * Actualizar factura
   */
  async updateInvoice(id, data) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true }
    });
    
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    
    // Si tiene pagos, no permitir cambiar el total
    if (invoice.payments.length > 0 && data.total && parseFloat(data.total) !== invoice.total) {
      throw new Error('No se puede modificar el total de una factura con pagos registrados');
    }
    
    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        invoiceNumber: data.invoiceNumber,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        subtotal: data.subtotal ? parseFloat(data.subtotal) : undefined,
        tax: data.tax !== undefined ? parseFloat(data.tax) : undefined,
        discount: data.discount !== undefined ? parseFloat(data.discount) : undefined,
        total: data.total ? parseFloat(data.total) : undefined,
        notes: data.notes
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            document: true
          }
        },
        payments: true
      }
    });
    
    return this.mapToResponse(updatedInvoice);
  }
  
  /**
   * Cancelar factura
   */
  async cancelInvoice(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true }
    });
    
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    
    if (invoice.payments.length > 0) {
      throw new Error('No se puede cancelar una factura con pagos registrados');
    }
    
    await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });
    
    return { message: 'Factura cancelada exitosamente' };
  }
  
  /**
   * Determinar estado de factura
   */
  determineStatus(paidAmount, balance, dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (balance === 0) {
      return 'PAID';
    } else if (paidAmount > 0) {
      return 'PARTIAL';
    } else if (today > due) {
      return 'OVERDUE';
    } else {
      return 'PENDING';
    }
  }
  
  /**
   * Generar número de pago único
   */
  async generatePaymentNumber() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PAG-${dateStr}`;
    
    const count = await prisma.invoicePayment.count({
      where: {
        createdAt: {
          gte: new Date(now.setHours(0, 0, 0, 0))
        }
      }
    });
    
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  
  /**
   * Mapear Invoice a InvoiceResponse
   */
  mapToResponse(invoice) {
    const paidAmount = invoice.payments 
      ? invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      : 0;
    
    const balance = invoice.total - paidAmount;
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      providerId: invoice.provider?.id,
      providerName: invoice.provider?.name,
      providerDocument: invoice.provider?.document,
      issueDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      paidAmount,
      balance,
      status: invoice.status,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      payments: invoice.payments ? invoice.payments.map(p => this.mapPaymentToResponse(p)) : []
    };
  }
  
  /**
   * Mapear Payment a PaymentResponse
   */
  mapPaymentToResponse(payment) {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      createdAt: payment.createdAt
    };
  }
}

module.exports = new InvoiceService();