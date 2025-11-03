// backend/src/services/dashboardService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DashboardService {
  // Obtener estadísticas generales del dashboard
  async getStats() {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Total de productos
      const totalProducts = await prisma.product.count();

      // Total de ventas del mes
      const monthlySales = await prisma.sale.aggregate({
        where: {
          date: {
            gte: startOfMonth
          }
        },
        _sum: {
          total: true
        },
        _count: true
      });

      // Ventas de hoy
      const todaySales = await prisma.sale.aggregate({
        where: {
          date: {
            gte: startOfToday
          }
        },
        _sum: {
          total: true
        },
        _count: true
      });

      // Productos con stock bajo (menos de 10 unidades)
      const lowStock = await prisma.stock.count({
        where: {
          quantity: {
            lt: 10
          }
        }
      });

      // Total de proveedores activos
      const activeProviders = await prisma.provider.count({
        where: {
          active: true
        }
      });

      return {
        totalProducts,
        monthlySalesAmount: monthlySales._sum.total || 0,
        monthlySalesCount: monthlySales._count || 0,
        todaySalesAmount: todaySales._sum.total || 0,
        todaySalesCount: todaySales._count || 0,
        lowStockProducts: lowStock,
        activeProviders
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Obtener ventas recientes (últimas 10)
  async getRecentSales() {
    try {
      const sales = await prisma.sale.findMany({
        take: 10,
        orderBy: {
          date: 'desc'
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              lastName: true
            }
          },
          saleDetails: {
            include: {
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      return sales;
    } catch (error) {
      console.error('Error getting recent sales:', error);
      throw error;
    }
  }

  // Obtener productos más vendidos (top 5)
  async getTopProducts() {
    try {
      const topProducts = await prisma.saleDetail.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      // Obtener información completa de los productos
      const productsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              name: true,
              price: true
            }
          });
          return {
            ...product,
            totalSold: item._sum.quantity
          };
        })
      );

      return productsWithDetails;
    } catch (error) {
      console.error('Error getting top products:', error);
      throw error;
    }
  }

  // Obtener datos para gráfico de ventas (últimos 7 días)
  async getSalesChart(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sales = await prisma.sale.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          date: true,
          total: true
        }
      });

      // Agrupar ventas por día
      const salesByDay = {};
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        salesByDay[dateKey] = 0;
      }

      sales.forEach(sale => {
        const dateKey = sale.date.toISOString().split('T')[0];
        if (salesByDay[dateKey] !== undefined) {
          salesByDay[dateKey] += Number(sale.total);
        }
      });

      // Convertir a array para el gráfico
      const chartData = Object.entries(salesByDay)
        .map(([date, total]) => ({
          date,
          total: Math.round(total * 100) / 100
        }))
        .reverse(); // Ordenar del más antiguo al más reciente

      return chartData;
    } catch (error) {
      console.error('Error getting sales chart data:', error);
      throw error;
    }
  }

  // Obtener productos con stock bajo
  async getLowStock(threshold = 10) {
    try {
      const lowStockProducts = await prisma.product.findMany({
        where: {
          stock: {
            quantity: {
              lt: threshold
            }
          }
        },
        include: {
          stock: true
        },
        orderBy: {
          stock: {
            quantity: 'asc'
          }
        }
      });

      return lowStockProducts;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();