import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react'
import useInventoryStore  from '../../store/inventoryStore'
import toast from 'react-hot-toast'

const AddProduct = () => {
  const navigate = useNavigate()
  const inventoryStore = useInventoryStore()
  const { 
    addProduct, 
    isReferenceUnique,
    categories,
    materials,
    colors,
    fetchProductOptions,
    isLoadingOptions
  } = inventoryStore
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      reference: '',
      name: '',
      category: '',
      material: '',
      color: '',
      supplier: '',
      description: '',
      costPrice: '',
      salePrice: '',
      minStock: '',
      sizes: [
        { size: '', stock: '', price: '' }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sizes'
  })

  // Watch para calcular valores automáticamente
  const costPrice = watch('costPrice')
  const salePrice = watch('salePrice')
  const sizes = watch('sizes')

  // Cargar opciones del producto al montar el componente
  useEffect(() => {
    fetchProductOptions()
  }, [])

  // Opciones de datos - ya no son estáticos, vienen del store
  const shoesSizes = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

  // Calcular margen de ganancia
  const calculateMargin = () => {
    if (costPrice && salePrice) {
      const margin = ((salePrice - costPrice) / costPrice * 100)
      return margin.toFixed(1)
    }
    return '0'
  }

  // Calcular stock total
  const calculateTotalStock = () => {
    return sizes.reduce((total, size) => {
      return total + (parseInt(size.stock) || 0)
    }, 0)
  }

  // Generar referencia automática
  const generateReference = () => {
    const category = getValues('category')
    const color = getValues('color')
    
    if (category && color) {
      let reference
      let attempts = 0
      
      do {
        const categoryCode = category.substring(0, 3).toUpperCase()
        const colorCode = color.substring(0, 2).toUpperCase()
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        reference = `${categoryCode}${colorCode}${randomNum}`
        attempts++
      } while (!isReferenceUnique(reference) && attempts < 10)
      
      setValue('reference', reference)
      toast.success('Referencia generada automáticamente')
    } else {
      toast.error('Selecciona categoría y color primero')
    }
  }

  // Aplicar precio base a todas las tallas
  const applyBasePriceToAll = () => {
    const basePrice = getValues('salePrice')
    if (basePrice) {
      const updatedSizes = sizes.map(size => ({
        ...size,
        price: basePrice
      }))
      setValue('sizes', updatedSizes)
      toast.success('Precio aplicado a todas las tallas')
    } else {
      toast.error('Ingresa el precio de venta base primero')
    }
  }

  const onSubmit = async (data) => {
    try {
      // Validaciones adicionales
      if (data.sizes.length === 0) {
        throw new Error('Debe agregar al menos una talla')
      }

      const hasValidSizes = data.sizes.some(size => size.size && size.stock !== '' && size.price)
      if (!hasValidSizes) {
        throw new Error('Debe completar al menos una talla con stock y precio')
      }

      // Validar referencia única
      if (!isReferenceUnique(data.reference)) {
        throw new Error('La referencia ya existe, debe ser única')
      }

      // Filtrar tallas válidas
      const validSizes = data.sizes.filter(size => size.size && size.stock !== '' && size.price)
      
      // Preparar datos para envío
      const productData = {
        reference: data.reference,
        name: data.name,
        category: data.category,
        material: data.material,
        color: data.color,
        supplier: data.supplier,
        description: data.description,
        costPrice: parseFloat(data.costPrice),
        salePrice: parseFloat(data.salePrice),
        minStock: parseInt(data.minStock),
        sizes: validSizes.map(size => ({
          ...size,
          stock: parseInt(size.stock),
          price: parseFloat(size.price)
        }))
      }

      // Enviar al store
      const result = await addProduct(productData)
      
      if (result.success) {
        toast.success('Producto agregado exitosamente')
        navigate('/inventory')
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error(error.message || 'Error al agregar el producto')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/inventory" 
            className="btn btn-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agregar Producto</h1>
            <p className="text-sm text-gray-500">
              Completa la información del nuevo producto
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referencia */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia del Producto *
                </label>
                <div className="flex space-x-2">
                  <input
                    {...register('reference', {
                      required: 'La referencia es requerida',
                      pattern: {
                        value: /^[A-Za-z0-9.-]+$/,
                        message: 'Solo letras mayúsculas y números'
                      },
                      validate: value => {
                        if (!isReferenceUnique(value)) {
                          return 'Esta referencia ya existe'
                        }
                      }
                    })}
                    type="text"
                    className={`input flex-1 ${errors.reference ? 'input-error' : ''}`}
                    placeholder="Ej: CAL001"
                  />
                  <button
                    type="button"
                    onClick={generateReference}
                    className="btn btn-secondary"
                  >
                    Generar
                  </button>
                </div>
                {errors.reference && (
                  <p className="mt-1 text-sm text-danger-600">{errors.reference.message}</p>
                )}
              </div>

              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  {...register('name', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 3,
                      message: 'Mínimo 3 caracteres'
                    }
                  })}
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Ej: Zapato Formal Negro"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  {...register('category', {
                    required: 'Selecciona una categoría'
                  })}
                  className={`select ${errors.category ? 'input-error' : ''}`}
                  disabled={isLoadingOptions}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-danger-600">{errors.category.message}</p>
                )}
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material *
                </label>
                <select
                  {...register('material', {
                    required: 'Selecciona un material'
                  })}
                  className={`select ${errors.material ? 'input-error' : ''}`}
                  disabled={isLoadingOptions}
                >
                  <option value="">Seleccionar material</option>
                  {materials.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
                {errors.material && (
                  <p className="mt-1 text-sm text-danger-600">{errors.material.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <select
                  {...register('color', {
                    required: 'Selecciona un color'
                  })}
                  className={`select ${errors.color ? 'input-error' : ''}`}
                  disabled={isLoadingOptions}
                >
                  <option value="">Seleccionar color</option>
                  {colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                {errors.color && (
                  <p className="mt-1 text-sm text-danger-600">{errors.color.message}</p>
                )}
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor
                </label>
                <input
                  {...register('supplier')}
                  type="text"
                  className="input"
                  placeholder="Ej: Calzados Premium"
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  {...register('description')}
                  className="textarea"
                  rows={3}
                  placeholder="Descripción detallada del producto..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Precios y Stock */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Precios y Stock</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Precio Costo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Costo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('costPrice', {
                      required: 'El precio de costo es requerido',
                      min: {
                        value: 1000,
                        message: 'Precio mínimo $1,000'
                      }
                    })}
                    type="number"
                    className={`input pl-8 ${errors.costPrice ? 'input-error' : ''}`}
                    placeholder="80000"
                  />
                </div>
                {errors.costPrice && (
                  <p className="mt-1 text-sm text-danger-600">{errors.costPrice.message}</p>
                )}
              </div>

              {/* Precio Venta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta Base *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    {...register('salePrice', {
                      required: 'El precio de venta es requerido',
                      min: {
                        value: 1000,
                        message: 'Precio mínimo $1,000'
                      },
                      validate: value => {
                        const cost = parseFloat(costPrice) || 0
                        const sale = parseFloat(value) || 0
                        if (sale <= cost) {
                          return 'El precio de venta debe ser mayor al costo'
                        }
                      }
                    })}
                    type="number"
                    className={`input pl-8 ${errors.salePrice ? 'input-error' : ''}`}
                    placeholder="120000"
                  />
                </div>
                {errors.salePrice && (
                  <p className="mt-1 text-sm text-danger-600">{errors.salePrice.message}</p>
                )}
                {costPrice && salePrice && (
                  <p className="mt-1 text-sm text-green-600">
                    Margen: {calculateMargin()}%
                  </p>
                )}
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo *
                </label>
                <input
                  {...register('minStock', {
                    required: 'El stock mínimo es requerido',
                    min: {
                      value: 1,
                      message: 'Mínimo 1 unidad'
                    }
                  })}
                  type="number"
                  className={`input ${errors.minStock ? 'input-error' : ''}`}
                  placeholder="20"
                />
                {errors.minStock && (
                  <p className="mt-1 text-sm text-danger-600">{errors.minStock.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tallas y Stock */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tallas y Stock</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={applyBasePriceToAll}
                className="btn btn-sm btn-secondary"
                disabled={!salePrice}
              >
                Aplicar precio base
              </button>
              <button
                type="button"
                onClick={() => append({ size: '', stock: '', price: '' })}
                className="btn btn-sm btn-primary"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Talla
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talla
                    </label>
                    <select
                      {...register(`sizes.${index}.size`)}
                      className="select"
                    >
                      <option value="">Seleccionar</option>
                      {shoesSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      {...register(`sizes.${index}.stock`)}
                      type="number"
                      className="input"
                      placeholder="10"
                      min="0"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                      <input
                        {...register(`sizes.${index}.price`)}
                        type="number"
                        className="input pl-8"
                        placeholder="120000"
                        min="1000"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="btn btn-sm btn-danger"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de Stock */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  Stock Total: {calculateTotalStock()} unidades
                </span>
                <span className="text-sm text-blue-600">
                  {fields.filter((_, index) => {
                    const sizeData = sizes[index]
                    return sizeData?.size && sizeData?.stock !== '' && sizeData?.price
                  }).length} tallas configuradas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            to="/inventory"
            className="btn btn-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProduct