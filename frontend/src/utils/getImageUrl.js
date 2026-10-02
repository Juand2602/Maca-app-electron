// frontend/src/utils/getImageUrl.js
/**
 * Convierte una ruta de imagen relativa devuelta por el backend
 * (ej: '/uploads/products/archivo.jpg') en una URL absoluta apuntando
 * al servidor backend. Sin esto, en producción (Electron carga el
 * frontend vía file://) la ruta relativa no resuelve a nada: el proxy
 * de Vite que la resuelve en desarrollo no existe fuera del dev server.
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null

  // Ya es una URL absoluta o un data URI (preview local) - no tocar
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const backendBaseUrl = apiUrl.replace(/\/api\/?$/, '')

  return `${backendBaseUrl}${imageUrl}`
}

export default getImageUrl
