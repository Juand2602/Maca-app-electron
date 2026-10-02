// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
const log = require("electron-log");
const fs = require("fs");
const os = require("os");

let mainWindow;
let backendProcess;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

log.transports.file.level = "info";
log.info("App starting...");

// ============= AUTO-UPDATER SETUP (SIMPLIFICADO - ESTILO BARBERÍA) =============

const { autoUpdater } = require("electron-updater");

// Configuración simple y directa
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Logger
autoUpdater.logger = {
  info: (msg) => log.info("[AutoUpdater]", msg),
  warn: (msg) => log.warn("[AutoUpdater]", msg),
  error: (msg) => log.error("[AutoUpdater]", msg),
  debug: (msg) => log.debug("[AutoUpdater]", msg),
};

// ============= EVENTOS AUTO-UPDATER (SIMPLIFICADOS) =============

autoUpdater.on("checking-for-update", () => {
  log.info("🔍 Verificando actualizaciones...");
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "checking",
      message: "Buscando actualizaciones...",
    });
  }
});

autoUpdater.on("update-available", (info) => {
  log.info("✅ Actualización disponible:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "available",
      message: `Nueva versión ${info.version} disponible`,
      version: info.version,
    });
  }
});

autoUpdater.on("update-not-available", (info) => {
  log.info("ℹ️ No hay actualizaciones disponibles");
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "not-available",
      message: "La aplicación está actualizada",
    });
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  const message = `Descargando: ${Math.round(progressObj.percent)}%`;
  log.info(message);
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "downloading",
      message,
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  }
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("✅ Actualización descargada:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "downloaded",
      message: "Actualización lista para instalar",
      version: info.version,
    });
  }
});

autoUpdater.on("error", (error) => {
  log.error("❌ Error en auto-updater:", error);
  if (mainWindow) {
    mainWindow.webContents.send("update-status", {
      status: "error",
      message: "Error al verificar actualizaciones",
      error: error.message,
    });
  }
});

// ============= FUNCIONES AUXILIARES =============

function getNodeExecutable() {
  const isDev = !app.isPackaged;

  if (isDev) {
    return "node";
  }

  const nodeBinaryName = process.platform === "win32" ? "node.exe" : "node";
  const nodePath = path.join(process.resourcesPath, "node", nodeBinaryName);
  log.info("Looking for Node.js at:", nodePath);

  if (fs.existsSync(nodePath)) {
    log.info("✅ Node.js portable found");
    return nodePath;
  }

  log.error("❌ Node.js portable NOT found");
  log.info("Trying system Node.js as fallback...");
  return "node";
}

function getBackendPath() {
  const isDev = !app.isPackaged;

  if (isDev) {
    return path.join(__dirname, "../backend/src/app.js");
  }

  const backendPath = path.join(
    process.resourcesPath,
    "backend",
    "src",
    "app.js"
  );
  log.info("Backend path:", backendPath);

  if (!fs.existsSync(backendPath)) {
    log.error("❌ Backend not found at:", backendPath);
    throw new Error(`Backend no encontrado: ${backendPath}`);
  }

  return backendPath;
}

function getDatabasePath() {
  const isDev = !app.isPackaged;

  log.info("=".repeat(60));
  log.info("DATABASE CONFIGURATION");
  log.info("=".repeat(60));
  log.info("Environment:", isDev ? "DEVELOPMENT" : "PRODUCTION");
  log.info("Is packaged:", app.isPackaged);

  if (isDev) {
    const dbDir = path.join(__dirname, "../backend/database");
    const dbPath = path.join(dbDir, "calzado.db");

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    log.info("Using development database");
    log.info("Path:", dbPath);
    log.info("Exists:", fs.existsSync(dbPath));

    return dbPath;
  }

  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "database");
  const dbPath = path.join(dbDir, "calzado.db");

  log.info("Using production database");
  log.info("User data path:", userDataPath);
  log.info("Database directory:", dbDir);
  log.info("Database file:", dbPath);

  if (!fs.existsSync(dbDir)) {
    log.info("Creating database directory...");
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      log.info("✅ Directory created");
    } catch (error) {
      log.error("❌ Failed to create directory:", error);
      throw error;
    }
  }

  if (!fs.existsSync(dbPath)) {
    log.info("Database file does not exist, creating empty file...");
    try {
      fs.writeFileSync(dbPath, "");
      log.info("✅ Empty database file created");
    } catch (error) {
      log.error("❌ Failed to create database file:", error);
      throw error;
    }
  } else {
    try {
      const stats = fs.statSync(dbPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log.info("✅ Database file exists");
      log.info("Size:", sizeMB, "MB");
      log.info("Last modified:", stats.mtime.toISOString());
    } catch (error) {
      log.warn("Could not read database stats:", error.message);
    }
  }

  try {
    fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
    log.info("✅ Read/Write permissions OK");
  } catch (error) {
    log.error("❌ Permission error:", error);
  }

  log.info("=".repeat(60));

  return dbPath;
}

function getBackendNodeModules() {
  const isDev = !app.isPackaged;

  if (isDev) {
    return path.join(__dirname, "../backend/node_modules");
  }

  return path.join(process.resourcesPath, "backend", "node_modules");
}

function getUploadsPath() {
  const isDev = !app.isPackaged;

  const uploadsDir = isDev
    ? path.join(__dirname, "../backend/uploads")
    : path.join(app.getPath("userData"), "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return uploadsDir;
}

// ============= INICIALIZACIÓN DE BASE DE DATOS =============

async function initializeDatabase() {
  const isDev = !app.isPackaged;

  if (isDev) {
    log.info("Development mode - skipping database initialization");
    return;
  }

  log.info("🗄️ Initializing database...");

  try {
    const databasePath = getDatabasePath();
    const backendDir = path.join(process.resourcesPath, "backend");
    const nodeModulesPath = getBackendNodeModules();
    const schemaPath = path.join(backendDir, "prisma", "schema.prisma");

    if (!fs.existsSync(schemaPath)) {
      log.error("❌ Prisma schema not found at:", schemaPath);
      return;
    }

    log.info("Found Prisma schema at:", schemaPath);

    const normalizedDbPath = databasePath.replace(/\\/g, "/");

    const env = {
      ...process.env,
      DATABASE_URL: `file:${normalizedDbPath}`,
      NODE_PATH: nodeModulesPath,
      PATH: `${path.join(nodeModulesPath, ".bin")}${path.delimiter}${
        process.env.PATH
      }`,
    };

    log.info("DATABASE_URL for migrations:", env.DATABASE_URL);

    const { execSync } = require("child_process");
    const nodeExe = getNodeExecutable();
    const prismaBin = path.join(nodeModulesPath, ".bin", "prisma");
    const prismaBinPath = process.platform === "win32" ? `${prismaBin}.cmd` : prismaBin;

    const prismaExists = fs.existsSync(prismaBinPath);
    if (!prismaExists) {
      log.error("❌ Prisma CLI not found");
      return;
    }

    log.info("Applying database migrations...");

    const migrateCmd = `"${prismaBinPath}" migrate deploy --schema="${schemaPath}"`;

    try {
      execSync(migrateCmd, {
        cwd: backendDir,
        env: env,
        encoding: "utf8",
        stdio: "pipe",
      });

      log.info("✅ Database migrations applied");
    } catch (migrateError) {
      log.error("❌ Migration failed:", migrateError.message);
      throw migrateError;
    }

    const seedPath = path.join(backendDir, "prisma", "seed.js");
    if (fs.existsSync(seedPath)) {
      log.info("Checking if database needs seeding...");

      const checkScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:${normalizedDbPath}' } }
});
prisma.user.count()
  .then(count => { 
    console.log(count); 
    return prisma.$disconnect(); 
  })
  .then(() => process.exit(0))
  .catch((err) => { 
    console.error(err);
    return prisma.$disconnect(); 
  })
  .then(() => process.exit(1));
`;

      const tempFile = path.join(os.tmpdir(), "sistema-calzado-seed-check.js");
      fs.writeFileSync(tempFile, checkScript);

      try {
        const result = execSync(`"${nodeExe}" "${tempFile}"`, {
          cwd: backendDir,
          env: env,
          encoding: "utf8",
          stdio: "pipe",
        });

        const userCount = parseInt(result.trim());
        log.info("User count:", userCount);

        fs.unlinkSync(tempFile);

        if (userCount === 0) {
          log.info("Running database seed...");

          execSync(`"${nodeExe}" "${seedPath}"`, {
            cwd: backendDir,
            env: env,
            encoding: "utf8",
            stdio: "pipe",
          });

          log.info("✅ Database seeded");
        } else {
          log.info("✅ Database already has data");
        }
      } catch (checkError) {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        log.warn("Seed check/execution failed:", checkError.message);
      }
    }

    log.info("✅ Database initialization completed");
  } catch (error) {
    log.error("❌ Database initialization failed:", error.message);
    log.error("Stack trace:", error.stack);
  }
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
      const uploadsPath = getUploadsPath();

      log.info("Node executable:", nodeExe);
      log.info("Backend script:", backendScript);
      log.info("Database path:", databasePath);
      log.info("Node modules:", nodeModulesPath);
      log.info("Uploads path:", uploadsPath);

      const backendDir = path.dirname(backendScript);

      const normalizedDbPath = databasePath.replace(/\\/g, "/");

      const env = {
        ...process.env,
        PORT: BACKEND_PORT.toString(),
        NODE_ENV: isDev ? "development" : "production",
        DATABASE_URL: `file:${normalizedDbPath}`,
        UPLOADS_DIR: uploadsPath,
        NODE_PATH: nodeModulesPath,
        PATH: `${path.join(nodeModulesPath, ".bin")}${path.delimiter}${
          process.env.PATH
        }`,
      };

      log.info("DATABASE_URL:", env.DATABASE_URL);

      const spawnOptions = {
        cwd: backendDir,
        env: env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      };

      if (!isDev) {
        spawnOptions.shell = false;
      }

      backendProcess = spawn(nodeExe, [backendScript], spawnOptions);

      let backendStarted = false;
      let errorOutput = "";

      backendProcess.stdout.on("data", (data) => {
        const output = data.toString();
        log.info("[Backend]", output);

        if (
          (output.includes("Server") ||
            output.includes("listening") ||
            output.includes("Sistema Calzado API")) &&
          !backendStarted
        ) {
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
      const response = await axios.get(
        `http://localhost:${BACKEND_PORT}/health`,
        {
          timeout: 3000,
        }
      );

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

    if (process.platform === "win32") {
      try {
        spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
      } catch (e) {
        log.error("Error killing backend:", e);
      }
    } else {
      backendProcess.kill("SIGTERM");
    }

    backendProcess = null;
  }
}

// ============= WINDOWS =============

function createSplashWindow() {
  const isDev = !app.isPackaged;
  const logoPath = isDev
    ? path.join(__dirname, "../frontend/public/logo-maca.png")
    : path.join(__dirname, "../frontend/dist/logo-maca.png");

  // La ventana del splash se carga como data: URL, y Chromium no permite
  // que un documento data: cargue un recurso file:// como subrecurso
  // ("Not allowed to load local resource"). Se incrusta el logo como
  // base64 para que quede en el mismo documento, sin petición aparte.
  let logoUrl = "";
  try {
    const logoBase64 = fs.readFileSync(logoPath).toString("base64");
    logoUrl = `data:image/png;base64,${logoBase64}`;
  } catch (error) {
    log.error("❌ No se pudo cargar el logo del splash:", error.message);
  }

  const splash = new BrowserWindow({
    width: 400,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  });

  splash.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100vw; height: 100vh;
          display: flex; justify-content: center; align-items: center;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .container { text-align: center; }
        .logo {
          width: 130px; margin: 0 auto 24px;
        }
        .logo img { width: 100%; height: auto; display: block; }
        h1 { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 6px; }
        p { font-size: 14px; color: #6b7280; }
        .loader {
          width: 150px; height: 3px;
          background: #e5e7eb;
          border-radius: 2px; margin: 24px auto 0; overflow: hidden;
        }
        .loader-bar {
          height: 100%; background: #111827;
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
        <div class="logo"><img src="${logoUrl}" alt="Maca" /></div>
        <h1>Sistema Administrativo</h1>
        <p>Iniciando aplicación...</p>
        <div class="loader"><div class="loader-bar"></div></div>
      </div>
    </body>
    </html>
  `)}`
  );

  return splash;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: true,
    },
  });

  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, "../frontend/dist/index.html")}`;

  log.info("📂 Loading:", startUrl);
  log.info("   Is dev:", isDev);
  log.info("   __dirname:", __dirname);

  if (!isDev) {
    const indexPath = path.join(__dirname, "../frontend/dist/index.html");
    if (!fs.existsSync(indexPath)) {
      log.error("❌ index.html not found at:", indexPath);
    } else {
      log.info("✅ index.html found at:", indexPath);
    }
  }

  mainWindow.loadURL(startUrl).catch((err) => {
    log.error("Failed to load URL:", err);
  });

  mainWindow.webContents.on("did-start-loading", () => {
    log.info("🔄 Started loading...");
  });

  mainWindow.webContents.on("did-stop-loading", () => {
    log.info("⏹️ Stopped loading");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      log.error("❌ Page failed to load:", {
        errorCode,
        errorDescription,
        validatedURL,
      });

      if (!mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools();
      }
    }
  );

  mainWindow.webContents.on("did-finish-load", () => {
    log.info("✅ Page finished loading");
  });

  mainWindow.webContents.on("dom-ready", () => {
    log.info("✅ DOM is ready");
  });

  mainWindow.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      if (level === 2 || level === 3) {
        log.error(`[Renderer] ${message} (${sourceId}:${line})`);
      }
    }
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ============= INIT =============

async function initializeApp() {
  let splash;

  try {
    splash = createSplashWindow();
    log.info("🚀 Initializing...");

    await initializeDatabase();
    await startBackend();
    await waitForBackend();

    const mainWin = createMainWindow();

    setTimeout(() => {
      log.info("Closing splash and showing main window");

      if (splash && !splash.isDestroyed()) {
        splash.close();
        log.info("✅ Splash closed");
      }

      if (!mainWin.isVisible()) {
        mainWin.show();
        log.info("✅ Main window shown");
      }

      mainWin.maximize();
      log.info("🎉 Window ready and visible!");
    }, 2000);

    setTimeout(() => {
      if (splash && !splash.isDestroyed()) {
        log.warn("Splash still open after 5s, forcing close");
        splash.close();
      }

      if (!mainWin.isVisible()) {
        log.warn("Window still not visible after 5s, forcing show");
        mainWin.show();
        mainWin.maximize();
      }
    }, 5000);

    // VERIFICAR ACTUALIZACIONES (Solo en producción)
    if (!isDev) {
      log.info("🚀 Programando verificación de actualizaciones...");
      setTimeout(() => {
        autoUpdater.checkForUpdates();
      }, 3000);
    }
  } catch (error) {
    log.error("❌ Init failed:", error);

    if (splash && !splash.isDestroyed()) splash.close();

    dialog.showErrorBox(
      "Error al iniciar",
      `No se pudo iniciar la aplicación:\n\n${error.message}\n\n` +
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

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

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

ipcMain.handle("check-backend-status", async () => {
  try {
    const response = await axios.get(
      `http://localhost:${BACKEND_PORT}/health`,
      { timeout: 2000 }
    );
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

// ============= IPC EVENTS (ESTILO BARBERÍA) =============

ipcMain.on("check-for-updates", () => {
  if (!isDev) {
    log.info("🔍 Verificando actualizaciones...");
    autoUpdater.checkForUpdates();
  } else {
    log.warn("Actualizaciones no disponibles en desarrollo");
  }
});

ipcMain.on("download-update", () => {
  log.info("⬇️ Descargando actualización...");
  autoUpdater.downloadUpdate();
});

ipcMain.on("install-update", () => {
  log.info("🔄 Instalando actualización...");
  autoUpdater.quitAndInstall(false, true);
});

// ============= ERROR HANDLING =============

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  log.error("Unhandled rejection:", error);
});
