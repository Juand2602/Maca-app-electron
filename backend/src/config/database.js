// backend/src/config/database.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Obtener la ruta de la base de datos según el entorno
function getDatabaseUrl() {
  // Si DATABASE_URL ya está definida, usarla
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment');
    return process.env.DATABASE_URL;
  }

  // Si no, inferir la ubicación según si es Electron o no
  let dbPath;

  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    // En producción sin DATABASE_URL, usar una ruta por defecto
    // Esta será sobreescrita por Electron
    dbPath = path.join(__dirname, '../../database/calzado.db');
  } else {
    // En desarrollo
    dbPath = path.join(__dirname, '../../database/calzado.db');
  }

  const url = `file:${dbPath}`;
  console.log('📊 Database URL inferred:', url);
  return url;
}

// Configurar Prisma Client con la URL correcta
const databaseUrl = getDatabaseUrl();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
});

// Manejo de errores de conexión
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error.message);
    // No lanzar error, permitir que la app intente continuar
  });

// Limpiar conexiones al cerrar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;