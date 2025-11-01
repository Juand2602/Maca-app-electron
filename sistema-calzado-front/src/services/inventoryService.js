import api from './api'

export const inventoryService = {
  // Obtener todos los productos
  getAllProducts: async (params = {}) => {
    try {
      const response = await api.get('/products', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  },

  // Obtener producto por ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching product:', error)
      if (error.response?.status === 404) {
        throw new Error('Producto no encontrado')
      }
      throw error
    }
  },

  // Crear producto
  createProduct: async (productData) => {
    try {
      // Transformar los datos del frontend al formato del backend
      const requestData = {
        code: productData.reference,
        name: productData.name,
        description: productData.description || '',
        brand: productData.supplier || 'Sin marca',
        category: productData.category,
        color: productData.color,
        material: productData.material,
        purchasePrice: productData.costPrice,
        salePrice: productData.salePrice,
        minStock: productData.minStock,
        isActive: true,
        stocks: productData.sizes.map(size => ({
          size: size.size,
          quantity: size.stock
        }))
      }

      const response = await api.post('/products', requestData)
      return response.data
    } catch (error) {
      console.error('Error creating product:', error)
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Datos inválidos')
      }
      throw error
    }
  },

  // Actualizar producto
  updateProduct: async (id, productData) => {
    try {
      // Transformar los datos del frontend al formato del backend
      const requestData = {
        code: productData.reference,
        name: productData.name,
        description: productData.description || '',
        brand: productData.supplier || 'Sin marca',
        category: productData.category,
        color: productData.color,
        material: productData.material,
        purchasePrice: productData.costPrice,
        salePrice: productData.salePrice,
        minStock: productData.minStock,
        isActive: true,
        stocks: productData.sizes.map(size => ({
          size: size.size,
          quantity: size.stock
        }))
      }

      console.log('Enviando datos al backend:', requestData)
      const response = await api.put(`/products/${id}`, requestData)
      console.log('Respuesta del backend:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating product:', error)
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Datos inválidos')
      }
      if (error.response?.status === 404) {
        throw new Error('Producto no encontrado')
      }
      throw error
    }
  },

  // Eliminar producto (desactivar)
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting product:', error)
      if (error.response?.status === 404) {
        throw new Error('Producto no encontrado')
      }
      throw error
    }
  },

  // Activar producto
  activateProduct: async (id) => {
    try {
      const response = await api.patch(`/products/${id}/activate`)
      return response.data
    } catch (error) {
      console.error('Error activating product:', error)
      if (error.response?.status === 404) {
        throw new Error('Producto no encontrado')
      }
      throw error
    }
  },

  // Eliminar múltiples productos
  deleteMultipleProducts: async (ids) => {
    try {
      // El backend no tiene endpoint para eliminación múltiple, así que lo hacemos uno por uno
      const promises = ids.map(id => api.delete(`/products/${id}`))
      await Promise.all(promises)
      return { success: true, deletedCount: ids.length }
    } catch (error) {
      console.error('Error deleting products:', error)
      throw error
    }
  },

  // Actualizar stock de un producto
  updateStock: async (id, sizeUpdates) => {
    try {
      // Primero obtenemos el producto actual
      const product = await inventoryService.getProductById(id)
      
      // Actualizamos los stocks
      const updatedStocks = product.stocks.map(stock => {
        const update = sizeUpdates.find(u => u.size === stock.size)
        return update ? { ...stock, quantity: update.stock } : stock
      })

      // Preparamos los datos para actualizar
      const requestData = {
        code: product.code,
        name: product.name,
        description: product.description || '',
        brand: product.brand,
        category: product.category,
        color: product.color,
        material: product.material,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        minStock: product.minStock,
        isActive: product.isActive,
        stocks: updatedStocks
      }

      const response = await api.put(`/products/${id}`, requestData)
      return response.data
    } catch (error) {
      console.error('Error updating stock:', error)
      throw error
    }
  },

  // Obtener estadísticas del inventario
  getInventoryStats: async () => {
    try {
      // Obtenemos todos los productos y calculamos las estadísticas
      const products = await inventoryService.getAllProducts()
      
      const stats = {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + (p.totalStock * p.purchasePrice), 0),
        lowStockProducts: products.filter(p => p.isLowStock).length,
        outOfStockProducts: products.filter(p => p.totalStock === 0).length,
        categoriesCount: {}
      }

      // Contamos productos por categoría
      products.forEach(product => {
        if (!stats.categoriesCount[product.category]) {
          stats.categoriesCount[product.category] = 0
        }
        stats.categoriesCount[product.category]++
      })

      return stats
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
      throw error
    }
  },

  // Obtener productos con stock bajo
  getLowStockProducts: async () => {
    try {
      const response = await api.get('/products/low-stock')
      return response.data
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      throw error
    }
  },

  // Buscar productos
  searchProducts: async (query) => {
    try {
      const response = await api.get('/products/search', { params: { q: query } })
      return response.data
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  },

  // Obtener categorías
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories')
      return response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  },
// Agregar estos métodos al inventoryService.js

// Obtener materiales
getMaterials: async () => {
  try {
    const response = await api.get('/products/materials')
    return response.data
  } catch (error) {
    console.error('Error fetching materials:', error)
    throw error
  }
},

// Obtener colores
getColors: async () => {
  try {
    const response = await api.get('/products/colors')
    return response.data
  } catch (error) {
    console.error('Error fetching colors:', error)
    throw error
  }
},

}