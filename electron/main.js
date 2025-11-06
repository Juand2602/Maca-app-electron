// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { autoUpdater } = require("electron-updater");
const axios = require("axios");
const log = require("electron-log");

let mainWindow;
let backendProcess;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

// ============= LOGGING =============

log.transports.file.level = "info";
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

log.info("App starting...");

// ============= AUTO-UPDATER =============

function setupAutoUpdater() {
  log.info("Configuring auto-updater...");
  
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available:", info);
  });

  autoUpdater.on("error", (err) => {
    log.error("Error in auto-updater:", err);
    if (mainWindow) {
      mainWindow.webContents.send("update-error", err);
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`);
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
    log.info("Checking for updates...");
    autoUpdater.checkForUpdates().catch(err => {
      log.error("Failed to check for updates:", err);
    });
  }, 10000);

  setInterval(() => {
    log.info("Periodic update check...");
    autoUpdater.checkForUpdates().catch(err => {
      log.error("Failed to check for updates:", err);
    });
  }, 4 * 60 * 60 * 1000);
}

// ============= BACKEND MANAGEMENT =============

async function startBackend() {
  return new Promise((resolve, reject) => {
    console.log("🔧 Starting backend server...");

    const isDev = !app.isPackaged;

    let backendExecutablePath;
    let backendProcessOptions;

    if (isDev) {
      backendExecutablePath = "node";
      const scriptPath = path.join(__dirname, "../backend/src/app.js");
      backendProcessOptions = {
        args: [scriptPath],
        cwd: path.join(__dirname, "../backend"),
        env: {
          ...process.env,
          PORT: BACKEND_PORT,
          NODE_ENV: "development",
          DATABASE_URL: `file:${path.join(
            __dirname,
            "../database/calzado.db"
          )}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      };
    } else {
      backendExecutablePath = path.join(process.resourcesPath, "backend.exe");

      backendProcessOptions = {
        args: [],
        cwd: path.dirname(backendExecutablePath),
        env: {
          ...process.env,
          PORT: BACKEND_PORT,
          NODE_ENV: "production",
          DATABASE_URL: `file:${path.join(
            process.resourcesPath,
            "database",
            "calzado.db"
          )}`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      };
    }

    console.log("Backend executable path:", backendExecutablePath);
    console.log("Backend options:", backendProcessOptions);

    backendProcess = spawn(
      backendExecutablePath,
      backendProcessOptions.args,
      backendProcessOptions
    );

    let backendStarted = false;

    backendProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[Backend]", output);

      // Detectar cuando el servidor está listo
      if ((output.includes("Server") || output.includes("listening") || output.includes("Sistema Calzado API")) && !backendStarted) {
        backendStarted = true;
        console.log("✅ Backend started successfully");
        // Esperar 2 segundos adicionales para asegurar que está completamente listo
        setTimeout(() => resolve(), 2000);
      }
    });

    backendProcess.stderr.on("data", (data) => {
      console.error("[Backend Error]", data.toString());
    });

    backendProcess.on("error", (error) => {
      console.error("Failed to start backend:", error);
      reject(error);
    });

    backendProcess.on("exit", (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0 && code !== null && !backendStarted) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    // Timeout de seguridad aumentado a 20 segundos
    setTimeout(() => {
      if (!backendStarted) {
        console.log("⚠️ Backend timeout reached, assuming started");
        resolve();
      }
    }, 20000);
  });
}

async function waitForBackend() {
  const maxAttempts = 40; // Aumentado de 30 a 40
  const delay = 1000;

  console.log("🔍 Waiting for backend to be ready...");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`   Attempt ${i + 1}/${maxAttempts}...`);
      const response = await axios.get(
        `http://localhost:${BACKEND_PORT}/health`,
        {
          timeout: 3000,
        }
      );

      if (response.data.status === "ok") {
        console.log("✅ Backend is healthy and ready!");
        console.log("   Backend info:", response.data);
        return true;
      }
    } catch (error) {
      // Backend aún no está listo, esperar
      if (i === maxAttempts - 1) {
        console.error("❌ Backend health check failed after all attempts");
        console.error("   Last error:", error.message);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Backend failed to start after 40 seconds");
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log("🛑 Stopping backend server...");
    backendProcess.kill();
    backendProcess = null;
  }
}

// ============= ELECTRON WINDOWS =============

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 400,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
    },
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
        p { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
        .status { font-size: 12px; opacity: 0.7; }
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
        <p class="status">Preparando servicios</p>
        <div class="loader"><div class="loader-bar"></div></div>
      </div>
    </body>
    </html>
  `;

  splash.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`
  );

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

  // CORRECCIÓN: Ruta correcta para producción
  const startUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, "../frontend/dist/index.html")}`;

  console.log("📂 Loading frontend from:", startUrl);
  console.log("   Is packaged:", app.isPackaged);
  console.log("   __dirname:", __dirname);

  mainWindow.loadURL(startUrl);

  // En desarrollo, abrir DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ============= APP INITIALIZATION =============

async function initializeApp() {
  let splash;
  
  try {
    splash = createSplashWindow();

    console.log("🚀 Initializing Sistema Calzado...");
    console.log("   Environment:", app.isPackaged ? "PRODUCTION" : "DEVELOPMENT");

    // 1. Iniciar backend
    console.log("\n📡 Step 1: Starting backend...");
    await startBackend();

    // 2. Esperar a que el backend esté listo
    console.log("\n🔍 Step 2: Verifying backend health...");
    await waitForBackend();

    // 3. Crear ventana principal
    console.log("\n🖥️  Step 3: Creating main window...");
    const mainWindow = createMainWindow();

    // 4. Esperar a que la ventana esté lista
    mainWindow.once("ready-to-show", () => {
      console.log("\n✅ Step 4: Window ready, showing application...");
      setTimeout(() => {
        if (splash && !splash.isDestroyed()) {
          splash.close();
        }
        mainWindow.show();
        mainWindow.maximize();
        console.log("🎉 Application ready!");
      }, 1000); // Delay adicional para asegurar que todo está cargado
    });

    // Timeout de seguridad para cerrar splash
    setTimeout(() => {
      if (splash && !splash.isDestroyed()) {
        console.log("⚠️ Force closing splash after timeout");
        splash.close();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
        }
      }
    }, 15000);

    // Auto-updater (solo en producción)
    if (app.isPackaged) {
      log.info("Setting up auto-updater...");
      setupAutoUpdater();
    } else {
      log.info("Development mode - auto-updater disabled");
    }
  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    console.error("   Error details:", error.stack);

    if (splash && !splash.isDestroyed()) {
      splash.close();
    }

    dialog.showErrorBox(
      "Error al iniciar",
      `No se pudo iniciar la aplicación:\n\n${error.message}\n\nDetalles en la consola.`
    );

    app.quit();
  }
}

// ============= APP EVENTS =============

app.whenReady().then(initializeApp);

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("before-quit", () => {
  stopBackend();
});

// ============= IPC HANDLERS =============

ipcMain.handle("get-backend-url", () => {
  return `http://localhost:${BACKEND_PORT}`;
});

ipcMain.handle("is-electron", () => {
  return true;
});

ipcMain.handle("check-backend-status", async () => {
  try {
    const response = await axios.get(
      `http://localhost:${BACKEND_PORT}/health`,
      {
        timeout: 2000,
      }
    );
    return response.data.status === "ok";
  } catch (error) {
    console.error("Backend health check failed:", error.message);
    return false;
  }
});

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// IPC para auto-updater
ipcMain.on("check-for-updates", () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(err => {
      log.error("Failed to check for updates:", err);
    });
  } else {
    if (mainWindow) {
      mainWindow.webContents.send(
        "update-status",
        "Auto-updater is disabled in development"
      );
    }
  }
});

ipcMain.on("download-update", () => {
  if (app.isPackaged) {
    autoUpdater.downloadUpdate().catch(err => {
      log.error("Failed to download update:", err);
    });
  }
});

ipcMain.on("restart-app", () => {
  autoUpdater.quitAndInstall(false, true);
});

// ============= ERROR HANDLING =============

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  log.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  log.error("Unhandled rejection:", error);
});