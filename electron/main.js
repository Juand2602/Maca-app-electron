// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const axios = require('axios');
const log = require('electron-log');

let mainWindow;
let backendProcess;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

// ============= LOGGING =============

// Configurar logging para auto-updater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.info('App starting...');

// ============= BACKEND MANAGEMENT =============

async function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting backend server...');
    
    const isDev = !app.isPackaged;
    
    // Ruta al backend
    const backendPath = isDev
      ? path.join(__dirname, '../backend/src/app.js')
      : path.join(process.resourcesPath, 'backend/src/app.js');
    
    console.log('Backend path:', backendPath);
    
    // Iniciar proceso del backend
    backendProcess = spawn('node', [backendPath], {
      cwd: isDev ? path.join(__dirname, '../backend') : path.join(process.resourcesPath, 'backend'),
      env: {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: isDev ? 'development' : 'production',
        DATABASE_URL: `file:${path.join(__dirname, '../database/calzado.db')}`
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Capturar logs del backend
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Backend]', output);
      
      // Detectar cuando el servidor está listo
      if (output.includes('Server') || output.includes('listening')) {
        console.log('✅ Backend started successfully');
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString());
    });
    
    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });
    
    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0 && code !== null) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });
    
    // Timeout de seguridad (si no inicia en 10 segundos)
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        console.log('✅ Backend timeout reached, assuming started');
        resolve();
      }
    }, 10000);
  });
}

async function waitForBackend() {
  const maxAttempts = 30;
  const delay = 1000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`🔍 Checking backend health... (attempt ${i + 1}/${maxAttempts})`);
      const response = await axios.get(`http://localhost:${BACKEND_PORT}/health`, {
        timeout: 2000
      });
      
      if (response.data.status === 'ok') {
        console.log('✅ Backend is healthy and ready');
        return true;
      }
    } catch (error) {
      // Backend aún no está listo, esperar
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Backend failed to start after 30 seconds');
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('🛑 Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// ============= ELECTRON WINDOWS =============

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false
    }
  });
  
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .container {
          text-align: center;
          color: white;
        }
        .logo {
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 20px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { font-size: 24px; margin-bottom: 10px; }
        p { font-size: 14px; opacity: 0.9; }
        .loader {
          width: 150px;
          height: 3px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          margin: 20px auto;
          overflow: hidden;
        }
        .loader-bar {
          height: 100%;
          background: white;
          animation: loading 1.5s ease-in-out infinite;
        }
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">👟</div>
        <h1>Sistema Calzado</h1>
        <p>Iniciando aplicación...</p>
        <div class="loader"><div class="loader-bar"></div></div>
      </div>
    </body>
    </html>
  `;
  
  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  
  return splash;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Cargar frontend
  const startUrl = !app.isPackaged
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
    
  console.log('Loading frontend from:', startUrl);
  mainWindow.loadURL(startUrl);
  
  // En desarrollo, abrir DevTools
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ============= APP INITIALIZATION =============

async function initializeApp() {
  try {
    const splash = createSplashWindow();
    
    console.log('🚀 Initializing Sistema Calzado...');
    
    // 1. Iniciar backend
    await startBackend();
    
    // 2. Esperar a que el backend esté listo
    await waitForBackend();
    
    // 3. Crear ventana principal
    console.log('🖥️  Creating main window...');
    const mainWindow = createMainWindow();
    
    // 4. Esperar a que la ventana esté lista
    mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
        splash.close();
        mainWindow.show();
        mainWindow.maximize();
        console.log('✅ Application ready!');
      }, 500);
    });
    
    // Auto-updater (solo en producción)
    if (app.isPackaged) {
      log.info('Setting up auto-updater...');
      setupAutoUpdater();
    } else {
      log.info('Development mode - auto-updater disabled');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Error al iniciar',
      `No se pudo iniciar la aplicación:\n\n${error.message}\n\nRevise la consola para más detalles.`
    );
    
    app.quit();
  }
}

// ============= APP EVENTS =============

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// ============= IPC HANDLERS =============

ipcMain.handle('get-backend-url', () => {
  return `http://localhost:${BACKEND_PORT}`;
});

ipcMain.handle('is-electron', () => {
  return true;
});

ipcMain.handle('check-backend-status', async () => {
  try {
    const response = await axios.get(`http://localhost:${BACKEND_PORT}/health`, {
      timeout: 2000
    });
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Backend health check failed:', error.message);
    return false;
  }
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('download-progress', progressObj);
});

ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.on('check-for-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  } else {
    mainWindow?.webContents.send('update-status', 'Auto-updater is disabled in development');
  }
});

// ============= ERROR HANDLING =============

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
}); 