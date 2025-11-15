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
  TrendingDown,
  AlertCircle,
  Plus,
  Eye,
  Calendar,
  Percent,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
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
    revenueChange: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    averageTicket: 0
  })
  const [topProductsData, setTopProductsData] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [salesByDay, setSalesByDay] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const statsData = await dashboardService.getStats()
      setStats(statsData)
      
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

      // Cargar datos de ventas recientes
      try {
        const recentSalesData = await dashboardService.getRecentSales?.() || []
        setRecentSales(recentSalesData)
      } catch (err) {
        console.error('Error loading recent sales:', err)
        setRecentSales([])
      }

      // Cargar datos de ventas por día (últimos 7 días)
      try {
        const salesByDayData = await dashboardService.getSalesByDay?.() || []
        setSalesByDay(salesByDayData)
      } catch (err) {
        console.error('Error loading sales by day:', err)
        setSalesByDay([])
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const StatCard = ({ title, value, icon: Icon, color, change, link, format = 'number', subtitle }) => {
    const formatValue = (val) => {
      if (format === 'currency') {
        return formatCurrency(val)
      }
      return val.toLocaleString()
    }

    const isPositive = change >= 0
    const TrendIcon = isPositive ? TrendingUp : TrendingDown

    return (
      <div className="card hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: color.replace('bg-', '').includes('primary') ? '#3b82f6' : color.replace('bg-', '').includes('success') ? '#10b981' : color.replace('bg-', '').includes('warning') ? '#f59e0b' : '#ef4444' }}>
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                  <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatValue(value)}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
              )}
              {change !== undefined && (
                <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs ayer</span>
                </div>
              )}
            </div>
          </div>
          {link && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to={link} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                Ver detalles
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Gráfica de líneas mejorada - Ventas por día
  const SalesLineChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              {title}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...data.map(d => d.total || 0))
    const minValue = Math.min(...data.map(d => d.total || 0))
    const range = maxValue - minValue || 1

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            {title}
          </h3>
        </div>
        <div className="card-body">
          <div className="h-80">
            <div className="flex h-full">
              {/* Eje Y */}
              <div className="flex flex-col justify-between text-xs text-gray-500 pr-3 w-20 text-right">
                <span>{formatCurrency(maxValue)}</span>
                <span>{formatCurrency(maxValue * 0.75)}</span>
                <span>{formatCurrency(maxValue * 0.5)}</span>
                <span>{formatCurrency(maxValue * 0.25)}</span>
                <span>$0</span>
              </div>
              
              {/* Área del gráfico */}
              <div className="flex-1 relative border-l-2 border-b-2 border-gray-200">
                {/* Líneas de guía horizontales */}
                <div className="absolute inset-0">
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <div
                      key={percent}
                      className="absolute w-full border-t border-gray-100"
                      style={{ bottom: `${percent}%` }}
                    />
                  ))}
                </div>

                {/* Gráfico de área */}
                <svg className="absolute inset-0 w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* Área bajo la línea */}
                  <path
                    d={`
                      M 0 ${100 - ((data[0].total - minValue) / range * 100)}
                      ${data.map((point, index) => {
                        const x = (index / (data.length - 1)) * 100
                        const y = 100 - ((point.total - minValue) / range * 100)
                        return `L ${x} ${y}`
                      }).join(' ')}
                      L 100 100
                      L 0 100
                      Z
                    `}
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Línea principal */}
                  <path
                    d={`
                      M 0 ${100 - ((data[0].total - minValue) / range * 100)}
                      ${data.map((point, index) => {
                        const x = (index / (data.length - 1)) * 100
                        const y = 100 - ((point.total - minValue) / range * 100)
                        return `L ${x} ${y}`
                      }).join(' ')}
                    `}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Puntos */}
                  {data.map((point, index) => {
                    const x = (index / (data.length - 1)) * 100
                    const y = 100 - ((point.total - minValue) / range * 100)
                    return (
                      <g key={index}>
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="5"
                          fill="#3b82f6"
                          stroke="white"
                          strokeWidth="2"
                          className="hover:r-7 transition-all cursor-pointer"
                        />
                        <title>{`${point.day}: ${formatCurrency(point.total)}`}</title>
                      </g>
                    )
                  })}
                </svg>

                {/* Etiquetas del eje X */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 -mb-6">
                  {data.map((point, index) => (
                    <span key={index} className="text-xs text-gray-600 transform -rotate-0">
                      {point.day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Gráfica de barras mejorada - Productos más vendidos
  const TopProductsChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              {title}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...data.map(d => d.quantity || 0))
    
    if (maxValue === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              {title}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay ventas registradas</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Colores para las barras
    const barColors = [
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500'
    ]

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            {title}
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {data.map((product, index) => {
              const percentage = (product.quantity / maxValue) * 100
              const color = barColors[index % barColors.length]
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center flex-1 min-w-0">
                      <span className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white font-bold text-sm mr-3 flex-shrink-0`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity} unidades vendidas
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(product.revenue || (product.quantity * (product.price || 0)))}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 ${color} rounded-full transition-all duration-500 ease-out relative`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-20"></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Tabla de ventas recientes mejorada
  const RecentSalesTable = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              {title}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay ventas recientes</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            {title}
          </h3>
          <Link to="/sales" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
            Ver todas
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <span className="font-mono text-sm font-medium text-gray-900">
                        #{sale.saleNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.customerName}</p>
                        {sale.customerPhone && (
                          <p className="text-xs text-gray-500">{sale.customerPhone}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{formatDate(sale.saleDate)}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">{sale.itemCount || sale.items?.length || 0} items</span>
                    </td>
                    <td>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(sale.total)}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        sale.status === 'COMPLETED' ? 'badge-success' :
                        sale.status === 'PENDING' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {sale.status === 'COMPLETED' ? 'Completada' :
                         sale.status === 'PENDING' ? 'Pendiente' :
                         sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Gráfica de categorías mejorada (Donut)
  const CategoriesDonutChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const total = data.reduce((sum, item) => sum + (item.count || 0), 0)
    
    if (total === 0) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No hay productos registrados</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    let currentAngle = -90
    const segments = data.map(item => {
      const percentage = (item.count / total) * 100
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

    const createPath = (startAngle, endAngle, innerRadius = 0.55, outerRadius = 0.95) => {
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
          <div className="flex flex-col items-center">
            <div className="relative w-56 h-56 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {segments.map((segment, index) => (
                  <g key={index} className="group">
                    <path
                      d={createPath(segment.startAngle, segment.endAngle)}
                      fill={segment.color}
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                  </g>
                ))}
              </svg>
              {/* Total en el centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{total}</p>
                  <p className="text-sm text-gray-500">Productos</p>
                </div>
              </div>
            </div>
            
            {/* Leyenda mejorada */}
            <div className="grid grid-cols-1 gap-3 w-full">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">{segment.name}</span>
                  </div>
                  <div className="flex items-center ml-4">
                    <span className="text-sm font-bold text-gray-900 mr-2">{segment.count}</span>
                    <span className="text-sm text-gray-500">({segment.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <AlertCircle className="h-16 w-16 text-danger-500 mb-4" />
        <p className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="btn btn-primary"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido, {user?.firstName || user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-primary-100">
          Aquí tienes un resumen completo de tu negocio
        </p>
      </div>

      {/* Stats Grid mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Productos"
          value={stats.totalProducts}
          icon={Package}
          color="bg-primary-500"
          link="/inventory"
          subtitle="En inventario"
        />
        <StatCard
          title="Ventas del Día"
          value={stats.todaySales}
          icon={ShoppingCart}
          color="bg-success-500"
          change={stats.salesChange}
          link="/sales"
          subtitle={`${stats.todaySales} transacciones`}
        />
        <StatCard
          title="Ingresos del Día"
          value={stats.dailyRevenue}
          icon={DollarSign}
          color="bg-warning-500"
          change={stats.revenueChange}
          format="currency"
          subtitle={stats.averageTicket ? `Ticket promedio: ${formatCurrency(stats.averageTicket)}` : ''}
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockItems}
          icon={AlertCircle}
          color="bg-danger-500"
          link="/inventory"
          subtitle="Productos por reabastecer"
        />
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Semanales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weeklyRevenue || 0)}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue || 0)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees || 0}</p>
              </div>
              <Users className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/sales/new"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="bg-primary-100 group-hover:bg-primary-200 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-primary-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-primary-700">
                  Nueva Venta
                </p>
              </div>
            </Link>

            <Link
              to="/inventory/add"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-success-500 hover:bg-success-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="bg-success-100 group-hover:bg-success-200 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Package className="h-8 w-8 text-success-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-success-700">
                  Nuevo Producto
                </p>
              </div>
            </Link>

            <Link
              to="/providers"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-warning-500 hover:bg-warning-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="bg-warning-100 group-hover:bg-warning-200 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-warning-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-warning-700">
                  Proveedores
                </p>
              </div>
            </Link>

            <Link
              to="/inventory"
              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="bg-purple-100 group-hover:bg-purple-200 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">
                  Ver Inventario
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <SalesLineChart data={salesByDay} title="Ventas de los Últimos 7 Días" />

        {/* Categorías de productos */}
        <CategoriesDonutChart data={productCategories} title="Distribución por Categorías" />
      </div>

      {/* Segunda fila de gráficas */}
      <div className="grid grid-cols-1 gap-6">
        {/* Productos más vendidos */}
        <TopProductsChart data={topProductsData} title="Top 5 Productos Más Vendidos" />
        
        {/* Ventas recientes */}
        <RecentSalesTable data={recentSales} title="Ventas Recientes" />
      </div>
    </div>
  )
}

export default Dashboard