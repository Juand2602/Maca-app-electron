// backend/prisma/seed-providers.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProviders() {
  console.log('🌱 Sembrando proveedores de prueba...');
  
  const providers = [
    {
      document: '900123456',
      name: 'Calzado Premium S.A.',
      businessName: 'Calzado Premium Sociedad Anónima',
      contactName: 'Juan Pérez',
      email: 'contacto@calzadopremium.com',
      phone: '3001234567',
      mobile: '3109876543',
      address: 'Calle 100 #15-30',
      city: 'Bogotá',
      country: 'Colombia',
      paymentTerms: '30 días después de la entrega',
      paymentDays: 30,
      notes: 'Proveedor principal de cuero italiano'
    },
    {
      document: '890456789',
      name: 'Distribuidora Nike Colombia',
      businessName: 'Nike Colombia S.A.S.',
      contactName: 'María González',
      email: 'ventas@nikecolombia.com',
      phone: '3201112233',
      mobile: '3159998877',
      address: 'Carrera 7 #32-16',
      city: 'Medellín',
      country: 'Colombia',
      paymentTerms: '60 días',
      paymentDays: 60,
      notes: 'Distribuidor oficial de Nike'
    },
    {
      document: '860789123',
      name: 'Importadora Adidas',
      businessName: 'Adidas Colombia Importaciones',
      contactName: 'Carlos Rodríguez',
      email: 'importaciones@adidas.com.co',
      phone: '3157778899',
      mobile: '3108887766',
      address: 'Avenida El Dorado #68-90',
      city: 'Bogotá',
      country: 'Colombia',
      paymentTerms: '45 días desde factura',
      paymentDays: 45,
      notes: 'Importador directo desde Alemania'
    },
    {
      document: '805123987',
      name: 'Suelas y Materiales',
      businessName: 'Suelas y Materiales Ltda.',
      contactName: 'Ana Martínez',
      email: 'ventas@suelasymateriales.com',
      phone: '3123334455',
      mobile: '3192223344',
      address: 'Calle 45 Sur #30-20',
      city: 'Cali',
      country: 'Colombia',
      paymentTerms: 'Contado',
      paymentDays: 0,
      notes: 'Proveedor de suelas y materiales sintéticos'
    },
    {
      document: '900888777',
      name: 'Cueros Finos Internacional',
      businessName: 'Cueros Finos S.A.',
      contactName: 'Roberto Silva',
      email: 'info@cuerosfinos.com',
      phone: '3165556677',
      mobile: '3144445566',
      address: 'Zona Industrial Puente Aranda',
      city: 'Bogotá',
      country: 'Colombia',
      paymentTerms: '15 días',
      paymentDays: 15,
      notes: 'Cueros de alta calidad importados de Italia y Argentina'
    }
  ];
  
  for (const providerData of providers) {
    await prisma.provider.create({
      data: providerData
    });
    
    console.log(`✅ Proveedor creado: ${providerData.name}`);
  }
  
  console.log('🎉 Proveedores de prueba creados exitosamente');
}

seedProviders()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error al sembrar proveedores:', e);
    await prisma.$disconnect();
    process.exit(1);
  });