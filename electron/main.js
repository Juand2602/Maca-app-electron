// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
const log = require("electron-log");
const fs = require("fs");

let mainWindow;
let backendProcess;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

log.transports.file.level = "info";
log.info("App starting...");

// ============= AUTO-UPDATER SETUP =============

let autoUpdater = null;

// Detectar si la app está instalada
function isAppInstalled() {
  if (!app.isPackaged) {
    log.info("Running in development mode");
    return false;
  }
  
  const appPath = app.getAppPath().toLowerCase();
  const exePath = app.getPath('exe').toLowerCase();
  
  // La app está instalada si está en Program Files o AppData\Local\Programs
  const isInProgramFiles = appPath.includes('program files') || 
                           appPath.includes('programfiles') ||
                           exePath.includes('program files') ||
                           exePath.includes('programfiles');
  
  const isInAppData = appPath.includes('appdata\\local\\programs') ||
                      exePath.includes('appdata\\local\\programs');
  
  const installed = isInProgramFiles || isInAppData;
  
  log.info('='.repeat(60));
  log.info('INSTALLATION DETECTION');
  log.info('='.repeat(60));
  log.info('App path:', appPath);
  log.info('Exe path:', exePath);
  log.info('Is in Program Files:', isInProgramFiles);
  log.info('Is in AppData:', isInAppData);
  log.info('Is installed:', installed);
  log.info('='.repeat(60));
  
  return installed;
}

const isInstalled = isAppInstalled();

// Cargar auto-updater solo si está instalada
if (isInstalled) {
  try {
    autoUpdater = require("electron-updater").autoUpdater;
    autoUpdater.logger = log;
    log.info("✅ Auto-updater loaded successfully");
  } catch (e) {
    log.error("❌ Failed to load electron-updater:", e.message);
    log.error("Stack:", e.stack);
  }
} else {
  log.warn("⚠️ Running in portable/dev mode - auto-updater disabled");
}

// ============= FUNCIONES AUXILIARES =============

function getNodeExecutable() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return process.platform === 'win32' ? 'node' : 'node';
  }
  
  const nodePath = path.join(process.resourcesPath, 'node', 'node.exe');
  log.info('Looking for Node.js at:', nodePath);
  
  if (fs.existsSync(nodePath)) {
    log.info('✅ Node.js portable found');
    return nodePath;
  }
  
  log.error('❌ Node.js portable NOT found');
  log.info('Trying system Node.js as fallback...');
  return 'node';
}

function getBackendPath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, "../backend/src/app.js");
  }
  
  const backendPath = path.join(process.resourcesPath, "backend", "src", "app.js");
  log.info('Backend path:', backendPath);
  
  if (!fs.existsSync(backendPath)) {
    log.error('❌ Backend not found at:', backendPath);
    throw new Error(`Backend no encontrado: ${backendPath}`);
  }
  
  return backendPath;
}

function getDatabasePath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, "../database/calzado.db");
  }
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'calzado.db');
  
  if (!fs.existsSync(dbPath)) {
    const templateDb = path.join(process.resourcesPath, "database", "calzado.db");
    if (fs.existsSync(templateDb)) {
      fs.copyFileSync(templateDb, dbPath);
      log.info('✅ Database copied to userData');
    } else {
      log.warn('⚠️ Template database not found');
    }
  }
  
  return dbPath;
}

function getBackendNodeModules() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, "../backend/node_modules");
  }
  
  return path.join(process.resourcesPath, "backend", "node_modules");
}

// ============= AUTO-UPDATER =============

function setupAutoUpdater() {
  if (!autoUpdater) {
    log.warn("Auto-updater not available");
    return;
  }
  
  log.info("Configuring auto-updater...");
  
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("No updates available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-not-available", info);
    }
  });

  autoUpdater.on("error", (err) => {
    log.error("Auto-updater error:", err);
    if (mainWindow) {
      mainWindow.webContents.send("update-error", {
        message: err.message,
        stack: err.stack
      });
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const message = `Downloaded ${progressObj.percent.toFixed(2)}%`;
    log.info(message);
    if (mainWindow) {
      mainWindow.webContents.send("download-progress", progressObj);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded", info);
    }
  });

  setTimeout(() => {
    log.info("Starting automatic update check...");
    autoUpdater.checkForUpdates().catch(err => {
      log.error("Update check failed:", err);
    });
  }, 10000);
}

// ============= BACKEND MANAGEMENT =============

async function startBackend() {
  return new Promise((resolve, reject) => {
    log.info("🔧 Starting backend server...");

    const isDev = !app.isPackaged;
    
    try {
      const nodeExe = getNodeExecutable();
      const backendScript = getBackendPath();
      const databasePath = getDatabasePath();
      const nodeModulesPath = getBackendNodeModules();

      log.info("Node executable:", nodeExe);
      log.info("Backend script:", backendScript);
      log.info("Database path:", databasePath);
      log.info("Node modules:", nodeModulesPath);

      const backendDir = path.dirname(backendScript);
      
      const env = {
        ...process.env,
        PORT: BACKEND_PORT.toString(),
        NODE_ENV: isDev ? "development" : "production",
        DATABASE_URL: `file:${databasePath}`,
        NODE_PATH: nodeModulesPath,
        PATH: `${path.join(nodeModulesPath, '.bin')}${path.delimiter}${process.env.PATH}`
      };

      const spawnOptions = {
        cwd: backendDir,
        env: env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      };

      if (!isDev) {
        spawnOptions.shell = false;
      }

      backendProcess = spawn(nodeExe, [backendScript], spawnOptions);

      let backendStarted = false;
      let errorOutput = '';

      backendProcess.stdout.on("data", (data) => {
        const output = data.toString();
        log.info("[Backend]", output);

        if ((output.includes("Server") || 
             output.includes("listening") || 
             output.includes("Sistema Calzado API")) && 
            !backendStarted) {
          backendStarted = true;
          log.info("✅ Backend started successfully");
          setTimeout(() => resolve(), 2000);
        }
      });

      backendProcess.stderr.on("data", (data) => {
        const error = data.toString();
        errorOutput += error;
        log.error("[Backend Error]", error);
      });

      backendProcess.on("error", (error) => {
        log.error("❌ Failed to start backend:", error);
        reject(new Error(`No se pudo iniciar el backend: ${error.message}`));
      });

      backendProcess.on("exit", (code, signal) => {
        log.info(`Backend process exited with code ${code}, signal ${signal}`);
        
        if (code !== 0 && code !== null && !backendStarted) {
          const errorMsg = `Backend cerró con código ${code}.\n\nError:\n${errorOutput}`;
          log.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });

      setTimeout(() => {
        if (!backendStarted) {
          log.warn("⚠️ Backend timeout - verificando conectividad...");
          resolve();
        }
      }, 15000);

    } catch (error) {
      log.error("❌ Exception starting backend:", error);
      reject(error);
    }
  });
}

async function waitForBackend() {
  const maxAttempts = 30;
  const delay = 1000;

  log.info("🔍 Waiting for backend...");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`http://localhost:${BACKEND_PORT}/health`, { 
        timeout: 3000 
      });
      
      if (response.data.status === "ok") {
        log.info("✅ Backend is ready!");
        log.info("Backend info:", response.data);
        return true;
      }
    } catch (error) {
      log.info(`Attempt ${i + 1}/${maxAttempts} - Backend not ready yet`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Backend no responde después de 30 intentos");
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    log.info("🛑 Stopping backend...");
    
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      } catch (e) {
        log.error("Error killing backend:", e);
      }
    } else {
      backendProcess.kill('SIGTERM');
    }
    
    backendProcess = null;
  }
}

// ============= WINDOWS =============

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 400,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  });

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100vw; height: 100vh;
          display: flex; justify-content: center; align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .container { text-align: center; color: white; }
        .logo {
          width: 100px; height: 100px; background: white;
          border-radius: 20px; margin: 0 auto 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 48px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { font-size: 24px; margin-bottom: 10px; }
        p { font-size: 14px; opacity: 0.9; }
        .loader {
          width: 150px; height: 3px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px; margin: 20px auto; overflow: hidden;
        }
        .loader-bar {
          height: 100%; background: white;
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
  `)}`);

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
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, "../frontend/dist/index.html")}`;

  log.info("📂 Loading:", startUrl);
  mainWindow.loadURL(startUrl);

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => { mainWindow = null; });

  return mainWindow;
}

// ============= INIT =============

async function initializeApp() {
  let splash;
  
  try {
    splash = createSplashWindow();
    log.info("🚀 Initializing...");

    await startBackend();
    await waitForBackend();

    const mainWin = createMainWindow();

    mainWin.once("ready-to-show", () => {
      setTimeout(() => {
        if (splash && !splash.isDestroyed()) splash.close();
        mainWin.show();
        mainWin.maximize();
        log.info("🎉 Ready!");
      }, 1000);
    });

    if (app.isPackaged && isInstalled) {
      setupAutoUpdater();
    }
    
  } catch (error) {
    log.error("❌ Init failed:", error);
    
    if (splash && !splash.isDestroyed()) splash.close();
    
    const errorMessage = error.message || 'Error desconocido';
    
    dialog.showErrorBox(
      "Error al iniciar",
      `No se pudo iniciar la aplicación:\n\n${errorMessage}\n\n` +
      `Soluciones posibles:\n` +
      `• Verifica que tienes Node.js instalado (https://nodejs.org)\n` +
      `• Ejecuta como administrador\n` +
      `• Desactiva el antivirus temporalmente\n` +
      `• Reinstala la aplicación`
    );
    
    app.quit();
  }
}

// ============= EVENTS =============

app.whenReady().then(initializeApp);

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopBackend);

// ============= IPC HANDLERS =============

ipcMain.handle("get-backend-url", () => {
  return `http://localhost:${BACKEND_PORT}`;
});

ipcMain.handle("is-electron", () => {
  return true;
});

ipcMain.handle("is-auto-updater-available", () => {
  const available = autoUpdater !== null && app.isPackaged && isInstalled;
  log.info("Auto-updater availability check:", {
    autoUpdaterExists: autoUpdater !== null,
    isPackaged: app.isPackaged,
    isInstalled: isInstalled,
    result: available
  });
  return available;
});

ipcMain.handle("check-backend-status", async () => {
  try {
    const response = await axios.get(`http://localhost:${BACKEND_PORT}/health`, { timeout: 2000 });
    return response.data.status === "ok";
  } catch (error) {
    return false;
  }
});

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// ============= IPC EVENTS =============

ipcMain.on("check-for-updates", () => {
  log.info("Manual update check requested");
  
  if (!app.isPackaged) {
    log.warn("Cannot check for updates in development mode");
    if (mainWindow) {
      mainWindow.webContents.send("update-error", {
        message: "Las actualizaciones no están disponibles en modo desarrollo"
      });
    }
    return;
  }
  
  if (!isInstalled) {
    log.warn("Cannot check for updates in portable mode");
    if (mainWindow) {
      mainWindow.webContents.send("update-error", {
        message: "Las actualizaciones no están disponibles en modo portable. Instala la aplicación."
      });
    }
    return;
  }
  
  if (!autoUpdater) {
    log.error("Auto-updater not loaded");
    if (mainWindow) {
      mainWindow.webContents.send("update-error", {
        message: "El sistema de actualizaciones no está disponible"
      });
    }
    return;
  }
  
  autoUpdater.checkForUpdates()
    .then(() => log.info("Update check initiated"))
    .catch(err => {
      log.error("Update check failed:", err);
      if (mainWindow) {
        mainWindow.webContents.send("update-error", {
          message: err.message || "Error al verificar actualizaciones"
        });
      }
    });
});

ipcMain.on("download-update", () => {
  log.info("Manual update download requested");
  
  if (autoUpdater && app.isPackaged && isInstalled) {
    autoUpdater.downloadUpdate()
      .then(() => log.info("Update download initiated"))
      .catch(err => {
        log.error("Update download failed:", err);
        if (mainWindow) {
          mainWindow.webContents.send("update-error", {
            message: err.message || "Error al descargar actualización"
          });
        }
      });
  } else {
    log.warn("Cannot download update - auto-updater not available");
  }
});

ipcMain.on("restart-app", () => {
  log.info("App restart requested");
  if (autoUpdater && app.isPackaged && isInstalled) {
    autoUpdater.quitAndInstall(false, true);
  } else {
    app.relaunch();
    app.exit(0);
  }
});

// ============= ERROR HANDLING =============

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  log.error("Unhandled rejection:", error);
});