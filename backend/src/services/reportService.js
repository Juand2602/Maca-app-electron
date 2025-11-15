// backend/src/services/reportService.js
const prisma = require('../config/database');

class ReportService {
  
  /**
   * Reporte de Ventas por Período
   */
  async getSalesReport(startDate, endDate, warehouse) {
    try {
      console.log('📊 Generating sales report:', { startDate, endDate, warehouse });
      
      const sales = await prisma.sale.findMany({
        where: {
          warehouse: warehouse,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          user: {
            select: {
              username: true,
              fullName: true // CORREGIDO: usar fullName en lugar de firstName/lastName
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  code: true,
                  category: true
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

      console.log(`✅ Found ${sales.length} sales`);

      // Calcular estadísticas
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
      const totalTax = sales.reduce((sum, sale) => sum + sale.tax, 0);
      const totalTransactions = sales.length;

      // Ventas por categoría
      const salesByCategory = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const category = item.product?.category || 'Sin categoría';
          if (!salesByCategory[category]) {
            salesByCategory[category] = {
              category,
              quantity: 0,
              total: 0
            };
          }
          salesByCategory[category].quantity += item.quantity;
          salesByCategory[category].total += item.subtotal;
        });
      });

      // Ventas por vendedor
      const salesByUser = {};
      sales.forEach(sale => {
        const userName = sale.user?.fullName || sale.user?.username || 'Desconocido';
        if (!salesByUser[userName]) {
          salesByUser[userName] = {
            user: userName,
            transactions: 0,
            total: 0
          };
        }
        salesByUser[userName].transactions += 1;
        salesByUser[userName].total += sale.total;
      });

      // Productos más vendidos
      const productSales = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const productName = item.product?.name || 'Producto eliminado';
          if (!productSales[productName]) {
            productSales[productName] = {
              product: productName,
              code: item.product?.code || 'N/A',
              quantity: 0,
              total: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].total += item.subtotal;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // Métodos de pago
      const paymentMethods = {};
      sales.forEach(sale => {
        sale.payments.forEach(payment => {
          const method = payment.paymentMethod;
          if (!paymentMethods[method]) {
            paymentMethods[method] = {
              method,
              count: 0,
              total: 0
            };
          }
          paymentMethods[method].count += 1;
          paymentMethods[method].total += payment.amount;
        });
      });

      return {
        summary: {
          totalSales,
          totalDiscount,
          totalTax,
          totalTransactions,
          averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          period: {
            start: startDate,
            end: endDate
          }
        },
        salesByCategory: Object.values(salesByCategory),
        salesByUser: Object.values(salesByUser),
        topProducts,
        paymentMethods: Object.values(paymentMethods),
        sales: sales.map(sale => ({
          id: sale.id,
          saleNumber: sale.saleNumber,
          date: sale.createdAt,
          customer: sale.customerName || 'Cliente General',
          user: sale.user?.fullName || sale.user?.username || 'Desconocido',
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          total: sale.total,
          itemsCount: sale.items.reduce((sum, item) => sum + item.quantity, 0)
        }))
      };
    } catch (error) {
      console.error('❌ Error in getSalesReport:', error);
      throw error;
    }
  }

  /**
   * Reporte de Compras (Facturas) por Período
   */
  async getPurchasesReport(startDate, endDate, warehouse) {
    const invoices = await prisma.invoice.findMany({
      where: {
        warehouse: warehouse,
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        provider: {
          select: {
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

    // Calcular estadísticas
    const totalPurchases = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((p, payment) => p + payment.amount, 0);
      return sum + paid;
    }, 0);
    const totalPending = totalPurchases - totalPaid;
    const totalInvoices = invoices.length;

    // Compras por proveedor
    const purchasesByProvider = {};
    invoices.forEach(invoice => {
      const providerName = invoice.provider?.name || 'Proveedor desconocido';
      if (!purchasesByProvider[providerName]) {
        purchasesByProvider[providerName] = {
          provider: providerName,
          invoices: 0,
          total: 0,
          paid: 0,
          pending: 0
        };
      }
      const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      purchasesByProvider[providerName].invoices += 1;
      purchasesByProvider[providerName].total += invoice.total;
      purchasesByProvider[providerName].paid += paid;
      purchasesByProvider[providerName].pending += (invoice.total - paid);
    });

    // Facturas por estado
    const invoicesByStatus = {};
    invoices.forEach(invoice => {
      const status = invoice.status;
      if (!invoicesByStatus[status]) {
        invoicesByStatus[status] = {
          status,
          count: 0,
          total: 0
        };
      }
      invoicesByStatus[status].count += 1;
      invoicesByStatus[status].total += invoice.total;
    });

    return {
      summary: {
        totalPurchases,
        totalPaid,
        totalPending,
        totalInvoices,
        paymentRate: totalPurchases > 0 ? (totalPaid / totalPurchases) * 100 : 0,
        period: {
          start: startDate,
          end: endDate
        }
      },
      purchasesByProvider: Object.values(purchasesByProvider),
      invoicesByStatus: Object.values(invoicesByStatus),
      invoices: invoices.map(invoice => {
        const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          date: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          provider: invoice.provider?.name,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          discount: invoice.discount,
          total: invoice.total,
          paid,
          pending: invoice.total - paid,
          status: invoice.status
        };
      })
    };
  }

  /**
   * Reporte de Inventario
   */
  async getInventoryReport(warehouse) {
    const products = await prisma.product.findMany({
      where: {
        warehouse: warehouse,
        isActive: true
      },
      include: {
        stocks: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calcular estadísticas
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => {
      const stock = product.stocks.reduce((s, st) => s + st.quantity, 0);
      return sum + stock;
    }, 0);

    const totalValue = products.reduce((sum, product) => {
      const stock = product.stocks.reduce((s, st) => s + st.quantity, 0);
      return sum + (stock * product.purchasePrice);
    }, 0);

    const lowStockProducts = products.filter(product => {
      const stock = product.stocks.reduce((s, st) => s + st.quantity, 0);
      return stock <= product.minStock;
    }).length;

    const outOfStockProducts = products.filter(product => {
      const stock = product.stocks.reduce((s, st) => s + st.quantity, 0);
      return stock === 0;
    }).length;

    // Inventario por categoría
    const inventoryByCategory = {};
    products.forEach(product => {
      const category = product.category;
      if (!inventoryByCategory[category]) {
        inventoryByCategory[category] = {
          category,
          products: 0,
          totalStock: 0,
          totalValue: 0
        };
      }
      const stock = product.stocks.reduce((s, st) => s + st.quantity, 0);
      inventoryByCategory[category].products += 1;
      inventoryByCategory[category].totalStock += stock;
      inventoryByCategory[category].totalValue += (stock * product.purchasePrice);
    });

    return {
      summary: {
        totalProducts,
        totalStock,
        totalValue,
        lowStockProducts,
        outOfStockProducts,
        averageStockPerProduct: totalProducts > 0 ? totalStock / totalProducts : 0
      },
      inventoryByCategory: Object.values(inventoryByCategory),
      products: products.map(product => {
        const totalStock = product.stocks.reduce((s, st) => s + st.quantity, 0);
        const reservedStock = product.stocks.reduce((s, st) => s + st.reservedQuantity, 0);
        const availableStock = totalStock - reservedStock;
        const stockValue = totalStock * product.purchasePrice;

        return {
          id: product.id,
          code: product.code,
          name: product.name,
          category: product.category,
          brand: product.brand,
          totalStock,
          reservedStock,
          availableStock,
          minStock: product.minStock,
          isLowStock: totalStock <= product.minStock,
          isOutOfStock: totalStock === 0,
          purchasePrice: product.purchasePrice,
          salePrice: product.salePrice,
          stockValue,
          potentialRevenue: availableStock * product.salePrice,
          margin: ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100,
          stocks: product.stocks.map(stock => ({
            size: stock.size,
            quantity: stock.quantity,
            reserved: stock.reservedQuantity,
            available: stock.quantity - stock.reservedQuantity
          }))
        };
      })
    };
  }

  /**
   * Estado de Resultados (P&L)
   */
  async getProfitLossReport(startDate, endDate, warehouse) {
    // Obtener ventas
    const sales = await prisma.sale.findMany({
      where: {
        warehouse: warehouse,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Obtener compras (facturas pagadas)
    const invoices = await prisma.invoice.findMany({
      where: {
        warehouse: warehouse,
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        payments: true
      }
    });

    // Calcular ingresos
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
    const netRevenue = totalRevenue - totalDiscount;

    // Calcular costo de ventas
    let costOfGoodsSold = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product) {
          costOfGoodsSold += item.quantity * item.product.purchasePrice;
        }
      });
    });

    // Calcular utilidad bruta
    const grossProfit = netRevenue - costOfGoodsSold;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // Gastos operativos (compras pagadas)
    const operatingExpenses = invoices.reduce((sum, invoice) => {
      const paid = invoice.payments.reduce((p, payment) => p + payment.amount, 0);
      return sum + paid;
    }, 0);

    // Utilidad neta
    const netProfit = grossProfit - operatingExpenses;
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      period: {
        start: startDate,
        end: endDate
      },
      revenue: {
        totalRevenue,
        totalDiscount,
        netRevenue
      },
      costs: {
        costOfGoodsSold,
        grossProfit,
        grossMargin
      },
      expenses: {
        operatingExpenses
      },
      profit: {
        netProfit,
        netMargin
      },
      breakdown: {
        transactionsCount: sales.length,
        averageTicket: sales.length > 0 ? totalRevenue / sales.length : 0,
        invoicesCount: invoices.length,
        averageInvoice: invoices.length > 0 ? operatingExpenses / invoices.length : 0
      }
    };
  }

  /**
   * Reporte de Proveedores
   */
  async getProvidersReport(warehouse) {
    const providers = await prisma.provider.findMany({
      where: {
        warehouse: warehouse,
        isActive: true
      },
      include: {
        invoices: {
          include: {
            payments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return providers.map(provider => {
      const totalInvoices = provider.invoices.length;
      const totalPurchases = provider.invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = provider.invoices.reduce((sum, inv) => {
        const paid = inv.payments.reduce((p, payment) => p + payment.amount, 0);
        return sum + paid;
      }, 0);
      const totalPending = totalPurchases - totalPaid;

      const overdueInvoices = provider.invoices.filter(inv => {
        const balance = inv.total - inv.payments.reduce((p, payment) => p + payment.amount, 0);
        return balance > 0 && new Date(inv.dueDate) < new Date();
      }).length;

      return {
        id: provider.id,
        name: provider.name,
        document: provider.document,
        city: provider.city,
        country: provider.country,
        email: provider.email,
        phone: provider.phone,
        paymentTerms: provider.paymentTerms,
        totalInvoices,
        totalPurchases,
        totalPaid,
        totalPending,
        overdueInvoices,
        paymentRate: totalPurchases > 0 ? (totalPaid / totalPurchases) * 100 : 0
      };
    });
  }

  /**
   * Reporte de Comisiones de Empleados
   */
  async getEmployeeCommissionsReport(startDate, endDate, warehouse) {
    // Obtener todas las ventas del período
    const sales = await prisma.sale.findMany({
      where: {
        warehouse: warehouse,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true, // CORREGIDO
            commissionRate: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true,
                salePrice: true,
                purchasePrice: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular comisiones por empleado
    const employeeCommissions = {};
    
    sales.forEach(sale => {
      const userId = sale.user?.id;
      if (!userId) return;
      
      const userName = sale.user.fullName || sale.user.username;
      const commissionRate = sale.user.commissionRate || 0;
      
      if (!employeeCommissions[userId]) {
        employeeCommissions[userId] = {
          employeeId: userId,
          employeeName: userName,
          commissionRate: commissionRate,
          totalSales: 0,
          salesCount: 0,
          totalCommission: 0,
          sales: []
        };
      }
      
      // Calcular comisión de la venta
      const saleCommission = (sale.total * commissionRate) / 100;
      
      employeeCommissions[userId].totalSales += sale.total;
      employeeCommissions[userId].salesCount += 1;
      employeeCommissions[userId].totalCommission += saleCommission;
      employeeCommissions[userId].sales.push({
        id: sale.id,
        saleNumber: sale.saleNumber,
        date: sale.createdAt,
        customerName: sale.customerName || 'Cliente General',
        total: sale.total,
        commission: saleCommission,
        items: sale.items.map(item => ({
          product: item.product?.name || 'Producto eliminado',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        }))
      });
    });

    // Convertir a array y ordenar por mayor comisión
    const employeesArray = Object.values(employeeCommissions)
      .sort((a, b) => b.totalCommission - a.totalCommission);

    // Calcular totales generales
    const summary = {
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalSalesCount: sales.length,
      totalCommissions: employeesArray.reduce((sum, emp) => sum + emp.totalCommission, 0),
      employeesCount: employeesArray.length,
      period: {
        start: startDate,
        end: endDate
      }
    };

    return {
      summary,
      employees: employeesArray
    };
  }
}

module.exports = new ReportService();