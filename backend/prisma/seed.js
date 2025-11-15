// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const path = require('path')

// Configurar DATABASE_URL si no está definida
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(__dirname, '../../database/calzado.db')
  process.env.DATABASE_URL = `file:${dbPath}`
  console.log('📊 DATABASE_URL set to:', process.env.DATABASE_URL)
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ['error', 'warn']
})

async function main() {
  console.log('='.repeat(60))
  console.log('🌱 INICIANDO SEED DE LA BASE DE DATOS')
  console.log('='.repeat(60))
  
  try {
    // ============= PASO 1: CREAR EL EMPLEADO ADMINISTRADOR =============
    // Primero creamos la entidad "Empleado", que es la principal.
    console.log('🧑‍💼 Creando empleado para el administrador...')
    
    const adminEmployee = await prisma.employee.upsert({
      where: { document: '0000000000' }, // Usamos el documento como identificador único
      update: {
        firstName: 'Administrador',
        lastName: 'del Sistema',
        email: 'admin@sistema.com',
        // Puedes actualizar otros campos si lo necesitas
      },
      create: {
        document: '0000000000',
        firstName: 'Administrador',
        lastName: 'del Sistema',
        birthDate: new Date('1990-01-01'),
        email: 'admin@sistema.com',
        phone: '+57 3001234567',
        address: 'Oficina Principal',
        city: 'Bucaramanga',
        hireDate: new Date(),
        status: 'ACTIVE',
        position: 'Administrador del Sistema', // Añadimos un campo que tenías en el modelo
      }
    })

    console.log('✅ Empleado administrador creado/actualizado.')
    console.log(`   🆔 ID Empleado: ${adminEmployee.id}`)
    console.log(`   👤 Nombre: ${adminEmployee.firstName} ${adminEmployee.lastName}`)
    console.log('')

    // ============= PASO 2: CREAR EL USUARIO Y VINCULARLO AL EMPLEADO =============
    // Ahora creamos el acceso al sistema y lo vinculamos con el empleado anterior.
    console.log('👤 Creando usuario administrador...')
    
    const adminPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@sistema.com' },
      update: {
        password: adminPassword,
        isActive: true,
        role: 'ADMIN',
        employeeId: adminEmployee.id // <-- VINCULACIÓN CLAVE: Actualizamos el employeeId
      },
      create: {
        username: 'admin',
        email: 'admin@sistema.com',
        password: adminPassword,
        fullName: 'Administrador del Sistema',
        role: 'ADMIN',
        isActive: true,
        employeeId: adminEmployee.id // <-- VINCULACIÓN CLAVE: Asignamos el employeeId del recién creado
      }
    })
    
    console.log('✅ Usuario administrador creado/actualizado y vinculado al empleado.')
    console.log('')
    console.log('   📧 Email:    admin@sistema.com')
    console.log('   🔑 Password: admin123')
    console.log('   👤 Usuario:  admin')
    console.log('   🔐 Role:     ADMIN')
    console.log('')
    console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña en la primera sesión')
    console.log('')
    
    const userCount = await prisma.user.count()
    const employeeCount = await prisma.employee.count()
    console.log(`📊 Total de usuarios: ${userCount}`)
    console.log(`👷 Total de empleados: ${employeeCount}`)
    console.log('')
    
  } catch (error) {
    console.error('❌ ERROR DURANTE EL SEED')
    console.error('Mensaje:', error.message)
    if (error.code === 'P2002') {
      console.log('ℹ️  Un registro único ya existe. Esto es normal si ejecutas el seed varias veces.')
    } else {
      console.error('Stack trace:', error.stack)
      throw error
    }
  }
  
  console.log('='.repeat(60))
  console.log('✅ SEED COMPLETADO EXITOSAMENTE')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })