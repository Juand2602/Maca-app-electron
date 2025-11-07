// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { autoUpdater } = require("electron-updater");
const axios = require("axios");
const log = require("electron-log");
const fs = require("fs");

let mainWindow;
let backendProcess;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

log.transports.file.level = "info";
autoUpdater.logger = log;
log.info("App starting...");

// ============= FUNCIONES AUXILIARES =============

function getNodeExecutable() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // En desarrollo, usar Node.js del sistema
    return process.platform === 'win32' ? 'node' : 'node';
  } else {
    // En producción, usar Node.js portable incluido
    const nodePath = path.join(process.resourcesPath, 'node', 'node.exe');
    
    console.log('Looking for Node.js at:', nodePath);
    
    if (fs.existsSync(nodePath)) {
      console.log('✅ Node.js portable found');
      return nodePath;
    } else {
      console.error('❌ Node.js portable NOT found at:', nodePath);
      console.log('📂 Contents of resources:');
      try {
        const files = fs.readdirSync(process.resourcesPath);
        console.log(files);
      } catch (e) {
        console.error('Cannot read resources:', e);
      }
      throw new Error('Node.js portable no encontrado. Por favor reinstala la aplicación.');
    }
  }
}

function getBackendPath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, "../backend/src/app.js");
  } else {
    // En producción, buscar en resources.asar.unpacked primero
    const unpackedPath = path.join(process.resourcesPath, "app.asar.unpacked", "backend", "src", "app.js");
    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
    // Sino, buscar en resources directamente
    return path.join(process.resourcesPath, "backend", "src", "app.js");
  }
}

function getDatabasePath() {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    return path.join(__dirname, "../database/calzado.db");
  } else {
    return path.join(process.resourcesPath, "database", "calzado.db");
  }
}

// ============= AUTO-UPDATER =============

function setupAutoUpdater() {
  log.info("Configuring auto-updater...");
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
    if (mainWindow) mainWindow.webContents.send("update-available", info);
  });

  autoUpdater.on("error", (err) => {
    log.error("Error in auto-updater:", err);
    if (mainWindow) mainWindow.webContents.send("update-error", err);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    if (mainWindow) mainWindow.webContents.send("download-progress", progressObj);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info);
    if (mainWindow) mainWindow.webContents.send("update-downloaded", info);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => log.error("Update check failed:", err));
  }, 10000);
}

// ============= BACKEND MANAGEMENT =============

async function startBackend() {
  return new Promise((resolve, reject) => {
    console.log("🔧 Starting backend server...");

    const isDev = !app.isPackaged;
    const backendScript = getBackendPath();
    const databasePath = getDatabasePath();

    console.log("Backend script:", backendScript);
    console.log("Database path:", databasePath);
    console.log("Is packaged:", app.isPackaged);

    if (!fs.existsSync(backendScript)) {
      const error = `Backend script not found: ${backendScript}`;
      console.error("❌", error);
      reject(new Error(error));
      return;
    }

    const backendDir = path.dirname(backendScript);
    const env = {
      ...process.env,
      PORT: BACKEND_PORT,
      NODE_ENV: isDev ? "development" : "production",
      DATABASE_URL: `file:${databasePath}`,
    };

    // SIMPLE: Siempre usar 'node' - el sistema lo encontrará
    const nodeCmd = process.platform === 'win32' ? 'node' : 'node';

    console.log("Starting with command:", nodeCmd);
    console.log("Working directory:", backendDir);

    backendProcess = spawn(nodeCmd, [backendScript], {
      cwd: backendDir,
      env: env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true  // IMPORTANTE: usar shell para encontrar node en PATH
    });

    let backendStarted = false;

    backendProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[Backend]", output);

      if ((output.includes("Server") || 
           output.includes("listening") || 
           output.includes("Sistema Calzado API")) && 
          !backendStarted) {
        backendStarted = true;
        console.log("✅ Backend started successfully");
        setTimeout(() => resolve(), 2000);
      }
    });

    backendProcess.stderr.on("data", (data) => {
      console.error("[Backend Error]", data.toString());
    });

    backendProcess.on("error", (error) => {
      console.error("❌ Failed to start backend:", error);
      reject(error);
    });

    backendProcess.on("exit", (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0 && code !== null && !backendStarted) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!backendStarted) {
        console.log("⚠️ Backend timeout - assuming started");
        resolve();
      }
    }, 15000);
  });
}

async function waitForBackend() {
  const maxAttempts = 30;
  const delay = 1000;

  console.log("🔍 Waiting for backend...");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`http://localhost:${BACKEND_PORT}/health`, { timeout: 3000 });
      if (response.data.status === "ok") {
        console.log("✅ Backend is ready!");
        return true;
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Backend failed to start");
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log("🛑 Stopping backend...");
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
    } else {
      backendProcess.kill();
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

  console.log("📂 Loading:", startUrl);
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
    console.log("🚀 Initializing...");

    await startBackend();
    await waitForBackend();

    const mainWindow = createMainWindow();

    mainWindow.once("ready-to-show", () => {
      setTimeout(() => {
        if (splash && !splash.isDestroyed()) splash.close();
        mainWindow.show();
        mainWindow.maximize();
        console.log("🎉 Ready!");
      }, 1000);
    });

    if (app.isPackaged) setupAutoUpdater();
  } catch (error) {
    console.error("❌ Init failed:", error);
    if (splash && !splash.isDestroyed()) splash.close();
    
    dialog.showErrorBox(
      "Error al iniciar",
      `No se pudo iniciar:\n\n${error.message}\n\nAsegúrate de que Node.js esté instalado en tu sistema.`
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

// ============= IPC =============

ipcMain.handle("get-backend-url", () => `http://localhost:${BACKEND_PORT}`);
ipcMain.handle("is-electron", () => true);
ipcMain.handle("check-backend-status", async () => {
  try {
    const response = await axios.get(`http://localhost:${BACKEND_PORT}/health`, { timeout: 2000 });
    return response.data.status === "ok";
  } catch (error) {
    return false;
  }
});
ipcMain.handle("get-user-data-path", () => app.getPath("userData"));
ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.on("check-for-updates", () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(err => log.error(err));
  }
});

ipcMain.on("download-update", () => {
  if (app.isPackaged) {
    autoUpdater.downloadUpdate().catch(err => log.error(err));
  }
});

ipcMain.on("restart-app", () => {
  autoUpdater.quitAndInstall(false, true);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  log.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  log.error("Unhandled rejection:", error);
});