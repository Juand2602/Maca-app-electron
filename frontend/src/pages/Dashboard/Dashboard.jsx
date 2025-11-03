// src/pages/Dashboard/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package,
  Truck,
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { dashboardService } from '../../services/dashboardService'

const Dashboard = () => {
  const { user, isAdmin } = useAuthStore()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    dailyRevenue: 0,
    lowStockItems: 0,
    todaySales: 0,
    totalEmployees: 0,
    salesChange: 0,
    revenueChange: 0
  })
  const [topProductsData, setTopProductsData] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Usamos useCallback para evitar que la función se recree en cada render
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Primero cargamos las estadísticas básicas
      const statsData = await dashboardService.getStats()
      setStats(statsData)
      
      // Luego cargamos los datos de los gráficos por separado para evitar errores
      try {
        const topProductsResponse = await dashboardService.getTopProductsData()
        setTopProductsData(topProductsResponse)
      } catch (err) {
        console.error('Error loading top products data:', err)
        setTopProductsData([])
      }
      
      try {
        const categoriesData = await dashboardService.getProductCategoriesData()
        setProductCategories(categoriesData)
      } catch (err) {
        console.error('Error loading product categories data:', err)
        setProductCategories([])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('No se pudieron cargar los datos del dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({ title, value, icon: Icon, color, change, link, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') {
        return formatCurrency(val)
      }
      return val.toLocaleString()
    }

    return (
      <div className="card hover:shadow-card-hover transition-shadow duration-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
              {change !== undefined && (
                <p className={`text-sm ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {change >= 0 ? '+' : ''}{change}% vs ayer
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          {link && (
            <div className="mt-4">
              <Link to={link} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver más →
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Componente para gráfica de donut mejorado con colores fijos
  const DonutChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">
                No hay datos disponibles
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Calcular el total
    const total = data.reduce((sum, item) => sum + (item.count || 0), 0)
    
    // Si el total es 0, mostrar mensaje
    if (total === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">
                No hay datos disponibles
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Calcular los porcentajes y ángulos para cada segmento
    let currentAngle = -90; // Empezar desde arriba
    const segments = data.map(item => {
      const percentage = total > 0 ? (item.count / total) * 100 : 0
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle += angle
      
      return {
        ...item,
        percentage,
        startAngle,
        endAngle
      }
    })

    // Función para calcular el path de un segmento
    const createPath = (startAngle, endAngle, innerRadius = 0.6, outerRadius = 0.9) => {
      const startAngleRad = (startAngle * Math.PI) / 180
      const endAngleRad = (endAngle * Math.PI) / 180
      
      const x1 = 50 + 50 * outerRadius * Math.cos(startAngleRad)
      const y1 = 50 + 50 * outerRadius * Math.sin(startAngleRad)
      const x2 = 50 + 50 * outerRadius * Math.cos(endAngleRad)
      const y2 = 50 + 50 * outerRadius * Math.sin(endAngleRad)
      
      const x3 = 50 + 50 * innerRadius * Math.cos(endAngleRad)
      const y3 = 50 + 50 * innerRadius * Math.sin(endAngleRad)
      const x4 = 50 + 50 * innerRadius * Math.cos(startAngleRad)
      const y4 = 50 + 50 * innerRadius * Math.sin(startAngleRad)
      
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
      
      return `M ${x1} ${y1} A ${50 * outerRadius} ${50 * outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${50 * innerRadius} ${50 * innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="card-body">
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {segments.map((segment, index) => (
                    <path
                      key={index}
                      d={createPath(segment.startAngle, segment.endAngle)}
                      fill={segment.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </svg>
              </div>
              <div className="ml-8 space-y-2">
                {segments.map((segment, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <span className="text-sm">{segment.name}: {segment.count} ({segment.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Componente para gráfica de barras corregido y funcional - Productos más vendidos
  const BarChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">
                No hay datos disponibles
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Encontrar el valor máximo para escalar las barras
    const maxValue = Math.max(...data.map(d => d.quantity || 0))
    
    // Si el máximo es 0, mostrar mensaje
    if (maxValue === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">
                No hay datos de ventas disponibles
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="card-body">
          <div className="h-64">
            <div className="flex flex-col h-full">
              {/* Eje Y */}
              <div className="flex h-full">
                <div className="flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>{maxValue}</span>
                  <span>{Math.round(maxValue * 0.75)}</span>
                  <span>{Math.round(maxValue * 0.5)}</span>
                  <span>{Math.round(maxValue * 0.25)}</span>
                  <span>0</span>
                </div>
                
                {/* Gráfica de barras horizontales para mejor visualización de nombres de productos */}
                <div className="flex-1 flex flex-col justify-between border-l border-b border-gray-200">
                  {data.map((product, index) => {
                    // Asegurarse de que el valor de cantidad sea un número válido
                    const quantityValue = typeof product.quantity === 'number' ? product.quantity : 0;
                    // Calcular el ancho como porcentaje
                    const widthPercentage = (quantityValue / maxValue) * 100;
                    
                    return (
                      <div key={index} className="flex items-center my-1">
                        <p className="text-xs text-gray-600 w-32 truncate mr-2" title={product.name}>{product.name}</p>
                        <div className="flex-1 relative">
                          <div 
                            className="bg-primary-500 rounded-r-md transition-all duration-300 hover:bg-primary-600 relative group h-5" 
                            style={{ width: `${widthPercentage}%`, minWidth: '5px' }}
                          >
                            {/* Tooltip que aparece al pasar el mouse */}
                            <div className="absolute left-full ml-2 top-0 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
                              {quantityValue} unidades vendidas
                              <div className="absolute top-1/2 left-0 transform -translate-x-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800"></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 ml-2 w-8 text-right">{quantityValue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.firstName || user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          Aquí tienes un resumen de tu negocio hoy
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Productos"
          value={stats.totalProducts}
          icon={Package}
          color="bg-primary-500"
          link="/inventory"
        />
        <StatCard
          title="Ventas del Día"
          value={stats.todaySales}
          icon={ShoppingCart}
          color="bg-success-500"
          change={stats.salesChange}
          link="/sales"
        />
        <StatCard
          title="Ingresos del Día"
          value={stats.dailyRevenue}
          icon={DollarSign}
          color="bg-warning-500"
          change={stats.revenueChange}
          format="currency"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockItems}
          icon={AlertCircle}
          color="bg-danger-500"
          link="/inventory"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/sales/new"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200 group"
            >
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto text-gray-400 group-hover:text-primary-500" />
                <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-primary-600">
                  Nueva Venta
                </p>
              </div>
            </Link>

            <Link
              to="/providers"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200 group"
            >
              <div className="text-center">
                <Truck className="h-8 w-8 mx-auto text-gray-400 group-hover:text-primary-500" />
                <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-primary-600">
                  Ver Proveedores
                </p>
              </div>
            </Link>

            <Link
              to="/inventory"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200 group"
            >
              <div className="text-center">
                <Eye className="h-8 w-8 mx-auto text-gray-400 group-hover:text-primary-500" />
                <p className="mt-2 text-sm font-medium text-gray-600 group-hover:text-primary-600">
                  Ver Inventario
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <BarChart data={topProductsData} title="Productos Más Vendidos" />

        {/* Product Categories Donut Chart */}
        <DonutChart data={productCategories} title="Categorías de Productos" />
      </div>
    </div>
  )
}

export default Dashboard