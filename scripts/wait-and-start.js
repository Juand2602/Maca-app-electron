// scripts/wait-and-start.js
const { spawn } = require('child_process');

// Pequeña pausa para asegurar que Vite (frontend) tenga tiempo de iniciar
const STARTUP_DELAY = 3000; // 3 segundos

async function startElectron() {
  console.log('⏳ Esperando a que el frontend esté listo...');
  
  // Esperamos un tiempo fijo en lugar de verificar el backend
  await new Promise(resolve => setTimeout(resolve, STARTUP_DELAY));
  
  console.log('✅ Continuando con Electron...');
  console.log('🚀 Iniciando Electron...');
  
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true
  });
  
  electron.on('close', (code) => {
    console.log(`Electron cerrado con código ${code}`);
    process.exit(code);
  });
}

startElectron();