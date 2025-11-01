import { create } from 'zustand'

// Crear el store con la sintaxis correcta
const useInventoryStore = create((set, get) => ({
  // Estado
  products: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  filters: {
    category: '',
    color: '',
    size: '',
    priceRange: '',
    stockStatus: '',
    productStatus: ''
  },

  // Acciones CRUD
  
  // Obtener todos los productos
  fetchProducts: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const products = await inventoryService.getAllProducts()
      
      set({
        products,
        isLoading: false
      })
      
      return { success: true, products }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar los productos' 
      })
      return { success: false, error: error.message }
    }
  },

  // Obtener producto por ID
  getProductById: async (id) => {
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const product = await inventoryService.getProductById(id)
      return product
    } catch (error) {
      set({ error: error.message || 'Error al cargar el producto' })
      return null
    }
  },

  // Agregar producto
  addProduct: async (productData) => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const newProduct = await inventoryService.createProduct(productData)
      
      set(state => ({
        products: [...state.products, newProduct],
        isLoading: false
      }))

      return { success: true, product: newProduct }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || error.message || 'Error al agregar el producto' 
      })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Actualizar producto
  updateProduct: async (id, productData) => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const updatedProduct = await inventoryService.updateProduct(id, productData)
      
      set(state => ({
        products: state.products.map(p => 
          p.id === parseInt(id) ? updatedProduct : p
        ),
        isLoading: false
      }))

      return { success: true, product: updatedProduct }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || error.message || 'Error al actualizar el producto' 
      })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Eliminar producto (desactivar)
  deleteProduct: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      await inventoryService.deleteProduct(id)
      
      // Actualizar el estado local para reflejar que el producto ha sido desactivado
      set(state => ({
        products: state.products.map(p => 
          p.id === parseInt(id) ? { ...p, isActive: false } : p
        ),
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || error.message || 'Error al eliminar el producto' 
      })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Activar producto
  activateProduct: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      await inventoryService.activateProduct(id)
      
      // Actualizar el estado local para reflejar que el producto ha sido activado
      set(state => ({
        products: state.products.map(p => 
          p.id === parseInt(id) ? { ...p, isActive: true } : p
        ),
        isLoading: false
      }))

      return { success: true }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || error.message || 'Error al activar el producto' 
      })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Eliminar múltiples productos
  deleteMultipleProducts: async (ids) => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const result = await inventoryService.deleteMultipleProducts(ids)
      
      // Actualizar el estado local para reflejar que los productos han sido desactivados
      set(state => ({
        products: state.products.map(p => 
          ids.includes(p.id) ? { ...p, isActive: false } : p
        ),
        isLoading: false
      }))

      return { success: true, deletedCount: result.deletedCount }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || error.message || 'Error al eliminar los productos' 
      })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Actualizar stock de un producto
  updateProductStock: async (id, sizeUpdates) => {
    set({ isLoading: true, error: null })
    
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const updatedProduct = await inventoryService.updateStock(id, sizeUpdates)
      
      set(state => ({
        products: state.products.map(p => 
          p.id === parseInt(id) ? updatedProduct : p
        ),
        isLoading: false
      }))

      return { success: true, product: updatedProduct }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || error.message || 'Error al actualizar el stock' 
      })
      return { success: false, error: error.response?.data?.error || error.message }
    }
  },

  // Filtros y búsqueda
  setSearchTerm: (term) => {
    set({ searchTerm: term })
  },

  setFilters: (newFilters) => {
    set(state => ({ 
      filters: { ...state.filters, ...newFilters }
    }))
  },

  clearFilters: () => {
    set({ 
      searchTerm: '',
      filters: {
        category: '',
        color: '',
        size: '',
        priceRange: '',
        stockStatus: '',
        productStatus: ''
      }
    })
  },

  // Obtener productos filtrados
  getFilteredProducts: () => {
    const { products, searchTerm, filters } = get()
    let filtered = [...products]

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtros adicionales
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category)
    }

    if (filters.color) {
      filtered = filtered.filter(product => product.color === filters.color)
    }

    if (filters.stockStatus) {
      filtered = filtered.filter(product => {
        if (filters.stockStatus === 'low') {
          return product.isLowStock
        } else if (filters.stockStatus === 'out') {
          return product.totalStock === 0
        }
        return true
      })
    }

    // Filtro por estado del producto
    if (filters.productStatus) {
      filtered = filtered.filter(product => {
        if (filters.productStatus === 'active') {
          return product.isActive === true
        } else if (filters.productStatus === 'inactive') {
          return product.isActive === false
        }
        return true
      })
    }

    return filtered
  },

  // Estadísticas del inventario
  getInventoryStats: async () => {
    try {
      const { inventoryService } = await import('../services/inventoryService')
      const stats = await inventoryService.getInventoryStats()
      return stats
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
      // Devolver valores por defecto en caso de error
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        categoriesCount: {}
      }
    }
  },

  // Validar referencia única
  isReferenceUnique: (reference, excludeId = null) => {
    const { products } = get()
    return !products.some(p => 
      p.code.toLowerCase() === reference.toLowerCase() && 
      p.id !== excludeId
    )
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null })
  },
// Agregar estos métodos al inventoryStore.js

// Estado
categories: [],
materials: [],
colors: [],
isLoadingOptions: false,

// Acciones
fetchCategories: async () => {
  try {
    const { inventoryService } = await import('../services/inventoryService')
    const categories = await inventoryService.getCategories()
    set({ categories })
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    // En caso de error, usar valores por defecto
    set({ categories: ['Formal', 'Casual', 'Deportivo', 'Botas', 'Sandalias'] })
    return ['Formal', 'Casual', 'Deportivo', 'Botas', 'Sandalias']
  }
},

fetchMaterials: async () => {
  try {
    const { inventoryService } = await import('../services/inventoryService')
    const materials = await inventoryService.getMaterials()
    set({ materials })
    return materials
  } catch (error) {
    console.error('Error fetching materials:', error)
    // En caso de error, usar valores por defecto
    set({ materials: ['Cuero Genuino', 'Cuero Sintético', 'Lona', 'Sintético', 'Gamuza'] })
    return ['Cuero Genuino', 'Cuero Sintético', 'Lona', 'Sintético', 'Gamuza']
  }
},

fetchColors: async () => {
  try {
    const { inventoryService } = await import('../services/inventoryService')
    const colors = await inventoryService.getColors()
    set({ colors })
    return colors
  } catch (error) {
    console.error('Error fetching colors:', error)
    // En caso de error, usar valores por defecto
    set({ colors: ['Negro', 'Marrón', 'Blanco', 'Beige', 'Gris', 'Azul', 'Rojo', 'Otro'] })
    return ['Negro', 'Marrón', 'Blanco', 'Beige', 'Gris', 'Azul', 'Rojo', 'Otro']
  }
},

fetchProductOptions: async () => {
  set({ isLoadingOptions: true })
  try {
    await Promise.all([
      get().fetchCategories(),
      get().fetchMaterials(),
      get().fetchColors()
    ])
  } finally {
    set({ isLoadingOptions: false })
  }
},



}))

// Exportar el store
export { useInventoryStore }
export default useInventoryStore