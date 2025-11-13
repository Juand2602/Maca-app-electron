// backend/src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // NUEVO
require('dotenv').config();

const app = express();

// ============= MIDDLEWARE =============

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NUEVO: Servir archivos estáticos (imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging (desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============= ROUTES (CON VALIDACIÓN) =============

// Función helper para cargar rutas con validación
function loadRoute(path, prefix) {
  try {
    const route = require(path);
    if (typeof route !== 'function' && typeof route !== 'object') {
      console.error(`❌ ERROR: ${path} no exporta un router válido`);
      console.error(`   Tipo recibido: ${typeof route}`);
      console.error(`   Valor:`, route);
      return null;
    }
    console.log(`✅ Ruta cargada: ${prefix} -> ${path}`);
    return route;
  } catch (error) {
    console.error(`❌ ERROR al cargar ${path}:`, error.message);
    return null;
  }
}

// Cargar rutas individualmente con validación
const authRoutes = loadRoute('./routes/auth', '/api/auth');
const productRoutes = loadRoute('./routes/products', '/api/products');
const providerRoutes = loadRoute('./routes/providers', '/api/providers');
const saleRoutes = loadRoute('./routes/sales', '/api/sales');
const invoiceRoutes = loadRoute('./routes/invoices', '/api/invoices');
const employeeRoutes = loadRoute('./routes/employees', '/api/employees');
const dashboardRoutes = loadRoute('./routes/dashboard', '/api/dashboard');
const uploadRoutes = loadRoute('./routes/upload', '/api/upload'); // NUEVO

// Montar rutas solo si se cargaron correctamente
if (authRoutes) app.use('/api/auth', authRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (providerRoutes) app.use('/api/providers', providerRoutes);
if (saleRoutes) app.use('/api/sales', saleRoutes);
if (invoiceRoutes) app.use('/api/invoices', invoiceRoutes);
if (employeeRoutes) app.use('/api/employees', employeeRoutes);
if (dashboardRoutes) app.use('/api/dashboard', dashboardRoutes);
if (uploadRoutes) app.use('/api/upload', uploadRoutes); // NUEVO

// Health check (sin prefijo /api para facilitar monitoreo)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Sistema Calzado API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    routes: {
      auth: !!authRoutes,
      products: !!productRoutes,
      providers: !!providerRoutes,
      sales: !!saleRoutes,
      invoices: !!invoiceRoutes,
      employees: !!employeeRoutes,
      dashboard: !!dashboardRoutes,
      upload: !!uploadRoutes // NUEVO
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema Calzado API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      products: '/api/products',
      providers: '/api/providers',
      sales: '/api/sales',
      invoices: '/api/invoices',
      employees: '/api/employees',
      dashboard: '/api/dashboard',
      upload: '/api/upload' // NUEVO
    }
  });
});

// ============= ERROR HANDLING =============

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: `No se encontró ${req.method} ${req.path}`,
    path: req.path,
    hint: 'Verifique que la ruta comience con /api'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Error de Multer (archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Archivo muy grande',
      message: 'El tamaño del archivo excede el límite permitido (5MB)'
    });
  }
  
  if (err.message && err.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      error: 'Tipo de archivo no válido',
      message: err.message
    });
  }
  
  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      error: 'Recurso duplicado',
      message: 'El recurso ya existe',
      field: err.meta?.target 
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Recurso no encontrado',
      message: 'El recurso solicitado no existe' 
    });
  }
  
  if (err.code === 'P2003') {
    return res.status(400).json({ 
      error: 'Violación de clave foránea',
      message: 'El registro está relacionado con otros recursos' 
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// ============= SERVER START =============

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  // NUEVO: Crear directorio de uploads si no existe
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Directorio de uploads creado:', uploadDir);
  }
  
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Sistema Calzado API`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
    console.log(`💾 Database: ${process.env.DATABASE_URL || 'SQLite local'}`);
    console.log('='.repeat(50));
  });
}

module.exports = app;