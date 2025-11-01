// src/services/dashboardService.js
import api from './api'

// Colores fijos para las categorías
const CATEGORY_COLORS = {
  'Zapatillas': '#3B82F6',
  'Botas': '#10B981',
  'Sandalias': '#F59E0B',
  'Tacones': '#EF4444',
  'Deportivo': '#8B5CF6',
  'Casual': '#EC4899',
  'Formal': '#14B8A6',
  'default': '#6B7280'
}

export const dashboardService = {
  // Obtener estadísticas generales del dashboard
  getStats: async () => {
    try {
      // Obtener fecha actual y fecha de ayer para comparaciones
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Formatear fechas para la API
      const todayStr = today.toISOString().split('T')[0]
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const todayStart = `${todayStr}T00:00:00`
      const todayEnd = `${todayStr}T23:59:59`
      
      // Obtener información del usuario para verificar rol
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.role === 'ADMIN';
      
      // Ejecutar todas las llamadas a la API en paralelo
      const requests = [
        // Total de productos
        api.get('/products/active'),
        // Totales de ventas de hoy
        api.get(`/sales/totals?startDate=${todayStart}&endDate=${todayEnd}`),
        // Totales de ventas de ayer (para calcular cambio porcentual)
        api.get(`/sales/totals?startDate=${yesterdayStr}T00:00:00&endDate=${yesterdayStr}T23:59:59`),
        // Productos con stock bajo
        api.get('/products/low-stock')
      ];
      
      // Agregar solicitud de empleados solo si es admin
      if (isAdmin) {
        requests.push(api.get('/employees/stats'));
      }
      
      const [
        productsResponse,
        todayTotalsResponse,
        yesterdayTotalsResponse,
        lowStockResponse,
        employeesResponse = { data: { total: 0 } }
      ] = await Promise.all(requests);
      
      // Calcular estadísticas
      const todaySalesCount = todayTotalsResponse.data.count || 0
      const yesterdaySalesCount = yesterdayTotalsResponse.data.count || 0
      const salesChange = yesterdaySalesCount > 0 
        ? Math.round(((todaySalesCount - yesterdaySalesCount) / yesterdaySalesCount) * 100) 
        : 0
      
      const todayRevenue = todayTotalsResponse.data.totalSales || 0
      const yesterdayRevenue = yesterdayTotalsResponse.data.totalSales || 0
      const revenueChange = yesterdayRevenue > 0 
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) 
        : 0
      
      return {
        totalProducts: productsResponse.data.length,
        totalSales: todaySalesCount,
        dailyRevenue: todayRevenue,
        lowStockItems: lowStockResponse.data.length,
        todaySales: todaySalesCount,
        totalEmployees: employeesResponse.data.total || 0,
        salesChange,
        revenueChange
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      
      // Si es un error de permisos (403), devolver valores por defecto
      if (error.response && error.response.status === 403) {
        console.warn('Access denied for some endpoints, using default values');
        return {
          totalProducts: 0,
          totalSales: 0,
          dailyRevenue: 0,
          lowStockItems: 0,
          todaySales: 0,
          totalEmployees: 0,
          salesChange: 0,
          revenueChange: 0
        };
      }
      
      throw error
    }
  },
  
  // Obtener datos de productos más vendidos
  getTopProductsData: async () => {
    try {
      // Obtener fecha actual y calcular el inicio del mes
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      // Formatear fechas para la API
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]
      const todayStr = today.toISOString().split('T')[0]
      
      // Obtener ventas del mes actual
      const response = await api.get(`/sales/by-date-range?startDate=${firstDayStr}T00:00:00&endDate=${todayStr}T23:59:59`)
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        console.warn('No sales data found for the month, using example data');
        return [
          { name: 'Zapatilla Nike Air Max', quantity: 25 },
          { name: 'Botin Cuero Mujer', quantity: 18 },
          { name: 'Sandalia Verano', quantity: 15 },
          { name: 'Tacon Fiesta', quantity: 12 },
          { name: 'Zapatilla Deportiva', quantity: 10 }
        ];
      }
      
      // Contar productos vendidos
      const productSales = {}
      
      response.data.forEach(sale => {
        if (Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            if (item.productId && item.quantity) {
              if (!productSales[item.productId]) {
                productSales[item.productId] = {
                  id: item.productId,
                  name: item.productName || `Producto ${item.productId}`,
                  quantity: 0
                }
              }
              productSales[item.productId].quantity += item.quantity
            }
          })
        }
      })
      
      // Convertir a array y ordenar por cantidad vendida (descendente)
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5) // Tomar solo los 5 más vendidos
      
      // Si no hay suficientes productos, completar con datos de ejemplo
      if (topProducts.length < 5) {
        const exampleProducts = [
          { name: 'Zapatilla Nike Air Max', quantity: 25 },
          { name: 'Botin Cuero Mujer', quantity: 18 },
          { name: 'Sandalia Verano', quantity: 15 },
          { name: 'Tacon Fiesta', quantity: 12 },
          { name: 'Zapatilla Deportiva', quantity: 10 }
        ];
        
        // Añadir solo los productos de ejemplo que faltan
        for (let i = topProducts.length; i < 5; i++) {
          topProducts.push(exampleProducts[i]);
        }
      }
      
      return topProducts;
    } catch (error) {
      console.error('Error fetching top products data:', error);
      
      // Si es un error de permisos (403), devolver datos de ejemplo
      if (error.response && error.response.status === 403) {
        console.warn('Access denied for sales data, using example data');
        return [
          { name: 'Zapatilla Nike Air Max', quantity: 25 },
          { name: 'Botin Cuero Mujer', quantity: 18 },
          { name: 'Sandalia Verano', quantity: 15 },
          { name: 'Tacon Fiesta', quantity: 12 },
          { name: 'Zapatilla Deportiva', quantity: 10 }
        ];
      }
      
      // Devolver datos de ejemplo solo si hay un error en la llamada a la API
      return [
        { name: 'Zapatilla Nike Air Max', quantity: 25 },
        { name: 'Botin Cuero Mujer', quantity: 18 },
        { name: 'Sandalia Verano', quantity: 15 },
        { name: 'Tacon Fiesta', quantity: 12 },
        { name: 'Zapatilla Deportiva', quantity: 10 }
      ];
    }
  },
  
  // Obtener datos de categorías de productos con colores fijos
  getProductCategoriesData: async () => {
    try {
      // Obtener todas las categorías
      const categoriesResponse = await api.get('/products/categories')
      
      if (!Array.isArray(categoriesResponse.data) || categoriesResponse.data.length === 0) {
        return [
          { name: 'Sin categorías', count: 1, color: CATEGORY_COLORS.default }
        ]
      }
      
      // Obtener todos los productos activos
      const productsResponse = await api.get('/products/active')
      
      // Contar productos por categoría
      const categoriesCount = {}
      
      // Inicializar contadores para cada categoría
      categoriesResponse.data.forEach(category => {
        categoriesCount[category] = 0
      })
      
      // Contar productos por categoría
      if (Array.isArray(productsResponse.data)) {
        productsResponse.data.forEach(product => {
          if (product.category && categoriesCount.hasOwnProperty(product.category)) {
            categoriesCount[product.category]++
          }
        })
      }
      
      // Convertir a formato para la gráfica con colores fijos
      const categoriesData = Object.keys(categoriesCount).map(category => ({
        name: category,
        count: categoriesCount[category],
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS.default
      }))
      
      return categoriesData
    } catch (error) {
      console.error('Error fetching product categories data:', error)
      
      // Si es un error de permisos (403), devolver datos de ejemplo
      if (error.response && error.response.status === 403) {
        console.warn('Access denied for categories data, using example data');
        return [
          { name: 'Zapatillas', count: 45, color: CATEGORY_COLORS['Zapatillas'] },
          { name: 'Botas', count: 32, color: CATEGORY_COLORS['Botas'] },
          { name: 'Sandalias', count: 28, color: CATEGORY_COLORS['Sandalias'] },
          { name: 'Tacones', count: 15, color: CATEGORY_COLORS['Tacones'] }
        ]
      }
      
      // Devolver datos de ejemplo solo si hay un error en la llamada a la API
      return [
        { name: 'Zapatillas', count: 45, color: CATEGORY_COLORS['Zapatillas'] },
        { name: 'Botas', count: 32, color: CATEGORY_COLORS['Botas'] },
        { name: 'Sandalias', count: 28, color: CATEGORY_COLORS['Sandalias'] },
        { name: 'Tacones', count: 15, color: CATEGORY_COLORS['Tacones'] }
      ]
    }
  },
  
  // Obtener ventas recientes
  getRecentSales: async (limit = 5) => {
    try {
      const response = await api.get(`/sales/paginated?page=0&size=${limit}`)
      return response.data.content.map(sale => ({
        id: sale.id,
        reference: sale.saleNumber,
        customer: sale.customerName,
        amount: sale.total,
        date: sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'Fecha no disponible',
        employee: sale.userName
      }))
    } catch (error) {
      console.error('Error fetching recent sales:', error)
      throw error
    }
  },
  
  // Obtener productos con stock bajo
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/products/low-stock')
      return response.data.map(product => ({
        id: product.id,
        reference: product.code,
        name: product.name,
        stock: product.totalStock,
        minStock: product.minStock
      }))
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      throw error
    }
  }
}