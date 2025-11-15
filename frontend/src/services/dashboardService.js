// src/services/dashboardService.js
import api from './api'

export const dashboardService = {
  // Obtener estadísticas generales del dashboard
  getStats: async () => {
    try {
      // CORREGIDO: Usar fecha actual del sistema, no fecha hardcodeada
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normalizar a medianoche
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      // Formatear fechas correctamente
      const todayStr = today.toISOString().split('T')[0]
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const todayStart = `${todayStr}T00:00:00`
      const todayEnd = `${todayStr}T23:59:59`
      const weekStart = `${startOfWeek.toISOString().split('T')[0]}T00:00:00`
      const monthStart = `${startOfMonth.toISOString().split('T')[0]}T00:00:00`
      
      console.log('📅 Fechas calculadas:', {
        todayStr,
        todayStart,
        todayEnd,
        yesterdayStr,
        weekStart,
        monthStart
      })
      
      // Obtener rol del usuario correctamente
      const authStorage = localStorage.getItem('auth-storage')
      let isAdmin = false
      
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage)
          isAdmin = parsed.state?.user?.role === 'ADMIN'
        } catch (e) {
          console.error('Error parsing auth storage:', e)
        }
      }
      
      // Obtener total de productos
      let totalProducts = 0
      try {
        const productsResponse = await api.get('/products/active')
        totalProducts = Array.isArray(productsResponse.data) ? productsResponse.data.length : 0
      } catch (error) {
        console.error('Error fetching products:', error.message)
      }
      
      // Obtener ventas de hoy
      let todaySalesCount = 0
      let todayRevenue = 0
      try {
        const todayTotalsResponse = await api.get(`/sales/totals?startDate=${todayStart}&endDate=${todayEnd}`)
        console.log('📊 Respuesta ventas de hoy:', todayTotalsResponse.data)
        todaySalesCount = todayTotalsResponse.data.count || 0
        todayRevenue = todayTotalsResponse.data.totalSales || 0
        
        // Si no hay ventas con el endpoint de totals, intentar contar manualmente
        if (todaySalesCount === 0) {
          console.log('🔄 No hay ventas en totals, intentando contar manualmente...')
          try {
            const salesResponse = await api.get('/sales')
            const allSales = Array.isArray(salesResponse.data) ? salesResponse.data : 
                            Array.isArray(salesResponse.data.data) ? salesResponse.data.data : []
            
            console.log('📦 Total de ventas en sistema:', allSales.length)
            
            // Filtrar ventas de hoy
            const todaySales = allSales.filter(sale => {
              const saleDate = new Date(sale.saleDate || sale.createdAt)
              const saleDateStr = saleDate.toISOString().split('T')[0]
              console.log('🔍 Comparando:', saleDateStr, 'con', todayStr)
              return saleDateStr === todayStr
            })
            
            todaySalesCount = todaySales.length
            todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
            console.log('✅ Ventas de hoy calculadas manualmente:', { todaySalesCount, todayRevenue })
          } catch (error) {
            console.error('❌ Error al calcular ventas manualmente:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching today sales:', error.message)
      }
      
      // Obtener ventas de ayer
      let yesterdaySalesCount = 0
      let yesterdayRevenue = 0
      try {
        const yesterdayTotalsResponse = await api.get(`/sales/totals?startDate=${yesterdayStr}T00:00:00&endDate=${yesterdayStr}T23:59:59`)
        yesterdaySalesCount = yesterdayTotalsResponse.data.count || 0
        yesterdayRevenue = yesterdayTotalsResponse.data.totalSales || 0
      } catch (error) {
        console.error('Error fetching yesterday sales:', error.message)
      }
      
      const salesChange = yesterdaySalesCount > 0 
        ? Math.round(((todaySalesCount - yesterdaySalesCount) / yesterdaySalesCount) * 100) 
        : (todaySalesCount > 0 ? 100 : 0)
      
      const revenueChange = yesterdayRevenue > 0 
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) 
        : (todayRevenue > 0 ? 100 : 0)
      
      // Obtener productos con stock bajo
      let lowStockItems = 0
      try {
        const lowStockResponse = await api.get('/products/low-stock')
        lowStockItems = Array.isArray(lowStockResponse.data) ? lowStockResponse.data.length : 0
      } catch (error) {
        console.error('Error fetching low stock:', error.message)
      }
      
      // Obtener ventas de la semana
      let weeklyRevenue = 0
      try {
        const weekTotalsResponse = await api.get(`/sales/totals?startDate=${weekStart}&endDate=${todayEnd}`)
        weeklyRevenue = weekTotalsResponse.data.totalSales || 0
      } catch (error) {
        console.error('Error fetching weekly sales:', error.message)
      }
      
      // Obtener ventas del mes
      let monthlyRevenue = 0
      try {
        const monthTotalsResponse = await api.get(`/sales/totals?startDate=${monthStart}&endDate=${todayEnd}`)
        monthlyRevenue = monthTotalsResponse.data.totalSales || 0
      } catch (error) {
        console.error('Error fetching monthly sales:', error.message)
      }
      
      // Obtener total de empleados
      let totalEmployees = 0
      if (isAdmin) {
        try {
          const employeesResponse = await api.get('/employees/stats')
          totalEmployees = employeesResponse.data.total || employeesResponse.data.active || 0
        } catch (error) {
          try {
            const employeesResponse = await api.get('/employees')
            totalEmployees = Array.isArray(employeesResponse.data) ? employeesResponse.data.length : 0
          } catch (innerError) {
            console.error('Error fetching employees:', innerError.message)
          }
        }
      }
      
      const averageTicket = todaySalesCount > 0 ? Math.round(todayRevenue / todaySalesCount) : 0
      
      const finalStats = {
        totalProducts,
        totalSales: todaySalesCount,
        dailyRevenue: todayRevenue,
        lowStockItems,
        todaySales: todaySalesCount,
        totalEmployees,
        salesChange,
        revenueChange,
        weeklyRevenue,
        monthlyRevenue,
        averageTicket
      }
      
      console.log('✅ Estadísticas finales:', finalStats)
      
      return finalStats
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalProducts: 0,
        totalSales: 0,
        dailyRevenue: 0,
        lowStockItems: 0,
        todaySales: 0,
        totalEmployees: 0,
        salesChange: 0,
        revenueChange: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        averageTicket: 0
      }
    }
  },
  
  // Obtener datos de productos más vendidos
  getTopProductsData: async () => {
    try {
      console.log('🔍 Obteniendo top productos...')
      
      // CORREGIDO: Usar fecha actual real
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]
      const todayStr = today.toISOString().split('T')[0]
      
      console.log('📅 Rango de fechas para top productos:', { desde: firstDayStr, hasta: todayStr })
      
      let sales = []
      try {
        const response = await api.get(`/sales/by-date-range?startDate=${firstDayStr}T00:00:00&endDate=${todayStr}T23:59:59`)
        sales = Array.isArray(response.data) ? response.data : []
        console.log('📊 Ventas encontradas en el rango:', sales.length)
        
        // Si no hay ventas con el endpoint de rango, obtener todas y filtrar
        if (sales.length === 0) {
          console.log('🔄 No hay ventas en rango, obteniendo todas...')
          const allSalesResponse = await api.get('/sales')
          const allSales = Array.isArray(allSalesResponse.data) ? allSalesResponse.data : 
                          Array.isArray(allSalesResponse.data.data) ? allSalesResponse.data.data : []
          
          // Filtrar ventas del mes actual
          sales = allSales.filter(sale => {
            const saleDate = new Date(sale.saleDate || sale.createdAt)
            return saleDate >= firstDayOfMonth && saleDate <= today
          })
          console.log('✅ Ventas filtradas del mes:', sales.length)
        }
      } catch (error) {
        console.error('Error fetching sales:', error.message)
      }
      
      if (sales.length === 0) {
        console.warn('⚠️ No hay ventas para procesar')
        return [];
      }
      
      const productSales = {}
      
      sales.forEach(sale => {
        if (Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            if (item.productId && item.quantity) {
              if (!productSales[item.productId]) {
                productSales[item.productId] = {
                  id: item.productId,
                  name: item.productName || item.name || `Producto ${item.productId}`,
                  quantity: 0,
                  revenue: 0
                }
              }
              productSales[item.productId].quantity += item.quantity
              productSales[item.productId].revenue += (item.price * item.quantity)
            }
          })
        }
      })
      
      console.log('📦 Productos procesados:', Object.keys(productSales).length)
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
      
      console.log('🏆 Top 5 productos:', topProducts)
      
      return topProducts;
    } catch (error) {
      console.error('Error fetching top products data:', error);
      return [];
    }
  },
  
  // Obtener datos de categorías de productos
  getProductCategoriesData: async () => {
    try {
      const categoriesResponse = await api.get('/products/categories')
      
      if (!Array.isArray(categoriesResponse.data) || categoriesResponse.data.length === 0) {
        return []
      }
      
      const productsResponse = await api.get('/products/active')
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : []
      
      const categoriesCount = {}
      
      categoriesResponse.data.forEach(category => {
        categoriesCount[category] = 0
      })
      
      products.forEach(product => {
        if (product.category && categoriesCount.hasOwnProperty(product.category)) {
          categoriesCount[product.category]++
        }
      })
      
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280']
      
      const categoriesData = Object.keys(categoriesCount)
        .filter(category => categoriesCount[category] > 0)
        .map((category, index) => ({
          name: category,
          count: categoriesCount[category],
          color: colors[index % colors.length]
        }))
      
      return categoriesData.length > 0 ? categoriesData : []
    } catch (error) {
      console.error('Error fetching product categories data:', error)
      return []
    }
  },
  
  // Obtener ventas recientes
  getRecentSales: async (limit = 5) => {
    try {
      let sales = []
      
      try {
        const response = await api.get(`/sales/paginated?page=0&size=${limit}`)
        
        if (response.data && Array.isArray(response.data.data)) {
          sales = response.data.data
        } else if (response.data && Array.isArray(response.data.content)) {
          sales = response.data.content
        }
      } catch (error) {
        console.error('Error with paginated endpoint:', error.message)
        
        try {
          const response = await api.get('/sales')
          const allSales = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response.data.data) ? response.data.data : []
          
          sales = allSales
            .sort((a, b) => new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt))
            .slice(0, limit)
        } catch (innerError) {
          console.error('Simple endpoint also failed:', innerError.message)
        }
      }
      
      if (sales.length === 0) {
        return []
      }
      
      const formattedSales = sales.map(sale => ({
        id: sale.id,
        saleNumber: sale.saleNumber || `#${sale.id}`,
        customerName: sale.customerName || 'Cliente General',
        customerPhone: sale.customerPhone || '',
        saleDate: sale.saleDate || sale.createdAt,
        total: sale.total || 0,
        status: sale.status || 'COMPLETED',
        itemCount: sale.items?.length || 0,
        items: sale.items || []
      }))
      
      return formattedSales
    } catch (error) {
      console.error('Error fetching recent sales:', error)
      return []
    }
  },
  
  // Obtener ventas por día (últimos 7 días)
  getSalesByDay: async (days = 7) => {
    try {
      // CORREGIDO: Usar fecha actual real
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - (days - 1))
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log('📅 Rango para ventas por día:', { desde: startDateStr, hasta: endDateStr })
      
      let sales = []
      
      try {
        const response = await api.get(
          `/sales/by-date-range?startDate=${startDateStr}T00:00:00&endDate=${endDateStr}T23:59:59`
        )
        sales = Array.isArray(response.data) ? response.data : []
        console.log('📊 Ventas en rango:', sales.length)
        
        // Si no hay ventas, intentar obtener todas y filtrar
        if (sales.length === 0) {
          console.log('🔄 Obteniendo todas las ventas para filtrar...')
          const allSalesResponse = await api.get('/sales')
          const allSales = Array.isArray(allSalesResponse.data) ? allSalesResponse.data : 
                          Array.isArray(allSalesResponse.data.data) ? allSalesResponse.data.data : []
          
          sales = allSales.filter(sale => {
            const saleDate = new Date(sale.saleDate || sale.createdAt)
            return saleDate >= startDate && saleDate <= endDate
          })
          console.log('✅ Ventas filtradas:', sales.length)
        }
      } catch (error) {
        console.error('Error fetching sales by date range:', error.message)
      }
      
      const salesByDay = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        const daySales = sales.filter(sale => {
          const saleDate = new Date(sale.saleDate || sale.createdAt)
          return saleDate >= date && saleDate < nextDate
        })
        
        const total = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
        const dayNumber = date.getDate()
        
        salesByDay.push({
          day: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber}`,
          date: date.toISOString().split('T')[0],
          total: total,
          count: daySales.length
        })
      }
      
      console.log('📊 Ventas por día procesadas:', salesByDay)
      
      return salesByDay
    } catch (error) {
      console.error('Error fetching sales by day:', error)
      return []
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