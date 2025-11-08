// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const path = require('path')

// Configurar DATABASE_URL si no está definida
if (!process.env.DATABASE_URL) {
  // Ruta desde backend/ hacia database/ en la raíz
  const dbPath = path.resolve(__dirname, '../../database/calzado.db')
  process.env.DATABASE_URL = `file:${dbPath}`
  console.log('📊 DATABASE_URL set to:', process.env.DATABASE_URL)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn']
})

async function main() {
  console.log('')
  console.log('='.repeat(60))
  console.log('🌱 INICIANDO SEED DE LA BASE DE DATOS')
  console.log('='.repeat(60))
  console.log('')
  
  try {
    // ============= USUARIO ADMINISTRADOR =============
    console.log('👤 Creando usuario administrador...')
    
    const adminPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@sistema.com' },
      update: {
        // Si existe, actualizar contraseña
        password: adminPassword,
        isActive: true,
        role: 'ADMIN'
      },
      create: {
        username: 'admin',
        email: 'admin@sistema.com',
        password: adminPassword,
        fullName: 'Administrador del Sistema',
        role: 'ADMIN',
        isActive: true
      }
    })
    
    console.log('✅ Usuario administrador creado/actualizado')
    console.log('')
    console.log('   📧 Email:    admin@sistema.com')
    console.log('   🔑 Password: admin123')
    console.log('   👤 Usuario:  admin')
    console.log('   🔐 Role:     ADMIN')
    console.log('')
    console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña en la primera sesión')
    console.log('')
    
    // Contar usuarios
    const userCount = await prisma.user.count()
    console.log(`📊 Total de usuarios en la base de datos: ${userCount}`)
    console.log('')
    
  } catch (error) {
    console.error('')
    console.error('❌ ERROR DURANTE EL SEED')
    console.error('Tipo de error:', error.constructor.name)
    console.error('Mensaje:', error.message)
    
    if (error.code) {
      console.error('Código Prisma:', error.code)
    }
    
    if (error.code === 'P2002') {
      console.log('')
      console.log('ℹ️  El usuario admin ya existe. Esto es normal.')
      console.log('')
    } else {
      console.error('')
      console.error('Stack trace:')
      console.error(error.stack)
      throw error
    }
  }
  
  console.log('='.repeat(60))
  console.log('✅ SEED COMPLETADO EXITOSAMENTE')
  console.log('='.repeat(60))
  console.log('')
}

main()
  .catch((error) => {
    console.error('')
    console.error('='.repeat(60))
    console.error('💥 SEED FALLÓ COMPLETAMENTE')
    console.error('='.repeat(60))
    console.error(error)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  })