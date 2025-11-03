// scripts/wait-and-start.js
const { spawn } = require('child_process');
const http = require('http');

const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;
const MAX_ATTEMPTS = 60; // 60 intentos = 1 minuto
const DELAY = 1000; // 1 segundo entre intentos

function checkServer(port, path = '/') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForServers() {
  console.log('🔍 Esperando a que el backend esté listo...');
  
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const backendReady = await checkServer(BACKEND_PORT, '/health');
    
    if (backendReady) {
      console.log('✅ Backend está listo!');
      // Dar un pequeño delay adicional para que Vite termine de cargar
      console.log('⏳ Esperando 3 segundos adicionales para Vite...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Continuando con Electron...');
      return true;
    }
    
    console.log(`⏳ Esperando Backend (${i + 1}/${MAX_ATTEMPTS})`);
    
    await new Promise(resolve => setTimeout(resolve, DELAY));
  }
  
  console.error('❌ Timeout esperando backend');
  return false;
}

async function startElectron() {
  const ready = await waitForServers();
  
  if (!ready) {
    console.error('❌ No se pudieron iniciar los servidores');
    process.exit(1);
  }
  
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