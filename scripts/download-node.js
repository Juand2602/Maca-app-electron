// scripts/download-node.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const NODE_VERSION = '20.11.0';
const PLATFORM = 'win';
const ARCH = 'x64';

const downloadUrl = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.zip`;
const outputDir = path.join(__dirname, '..', 'node-portable');
const zipFile = path.join(outputDir, 'node.zip');
const nodeExePath = path.join(outputDir, 'node.exe');

console.log('');
console.log('='.repeat(60));
console.log('📦 DOWNLOADING NODE.JS PORTABLE');
console.log('='.repeat(60));
console.log('Version:', NODE_VERSION);
console.log('Platform:', `${PLATFORM}-${ARCH}`);
console.log('URL:', downloadUrl);
console.log('Output dir:', outputDir);
console.log('');

// Limpiar directorio si existe
if (fs.existsSync(outputDir)) {
  console.log('🧹 Cleaning existing directory...');
  fs.rmSync(outputDir, { recursive: true, force: true });
}

// Crear directorio
fs.mkdirSync(outputDir, { recursive: true });
console.log('✅ Directory created');

// Función para descargar
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    console.log('📥 Downloading...');
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Seguir redirección
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      let lastPercent = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = Math.floor((downloadedSize / totalSize) * 100);
        
        if (percent !== lastPercent && percent % 10 === 0) {
          process.stdout.write(`\r   Progress: ${percent}%`);
          lastPercent = percent;
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\r   Progress: 100%');
        console.log('✅ Download completed');
        console.log(`   Size: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      });

      file.on('error', (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

// Función para extraer ZIP (PowerShell)
function extractZip(zipPath, extractTo) {
  console.log('');
  console.log('📂 Extracting ZIP...');
  
  try {
    // Crear comando PowerShell para extraer
    const psCommand = `
      $ProgressPreference = 'SilentlyContinue'
      Expand-Archive -Path '${zipPath}' -DestinationPath '${extractTo}' -Force
      Write-Host "Extraction completed"
    `;
    
    execSync(`powershell -Command "${psCommand}"`, { 
      stdio: 'inherit',
      encoding: 'utf8' 
    });
    
    console.log('✅ Extraction completed');
    return true;
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    return false;
  }
}

// Función para mover archivos
function moveNodeExecutable() {
  console.log('');
  console.log('📦 Moving node.exe...');
  
  const extractedFolder = path.join(outputDir, `node-v${NODE_VERSION}-${PLATFORM}-${ARCH}`);
  const sourceNodeExe = path.join(extractedFolder, 'node.exe');
  
  console.log('   Looking for:', sourceNodeExe);
  
  if (!fs.existsSync(extractedFolder)) {
    console.error('❌ Extracted folder not found:', extractedFolder);
    console.log('   Contents of output dir:');
    fs.readdirSync(outputDir).forEach(file => {
      console.log(`     - ${file}`);
    });
    return false;
  }
  
  if (!fs.existsSync(sourceNodeExe)) {
    console.error('❌ node.exe not found in extracted folder');
    console.log('   Contents of extracted folder:');
    fs.readdirSync(extractedFolder).forEach(file => {
      console.log(`     - ${file}`);
    });
    return false;
  }
  
  // Copiar node.exe
  fs.copyFileSync(sourceNodeExe, nodeExePath);
  console.log('✅ node.exe copied');
  
  // Verificar tamaño
  const stats = fs.statSync(nodeExePath);
  const sizeMB = stats.size / 1024 / 1024;
  console.log(`   Size: ${sizeMB.toFixed(2)} MB`);
  
  if (sizeMB < 20) {
    console.error('⚠️  WARNING: File size seems too small!');
    return false;
  }
  
  return true;
}

// Función para limpiar archivos temporales
function cleanup() {
  console.log('');
  console.log('🧹 Cleaning up...');
  
  const extractedFolder = path.join(outputDir, `node-v${NODE_VERSION}-${PLATFORM}-${ARCH}`);
  
  // Eliminar carpeta extraída
  if (fs.existsSync(extractedFolder)) {
    fs.rmSync(extractedFolder, { recursive: true, force: true });
    console.log('   ✓ Removed extracted folder');
  }
  
  // Eliminar ZIP
  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
    console.log('   ✓ Removed ZIP file');
  }
  
  console.log('✅ Cleanup completed');
}

// Función principal
async function main() {
  try {
    // 1. Descargar
    await downloadFile(downloadUrl, zipFile);
    
    // Verificar descarga
    if (!fs.existsSync(zipFile)) {
      throw new Error('ZIP file not found after download');
    }
    
    const zipStats = fs.statSync(zipFile);
    console.log(`   ZIP size: ${(zipStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 2. Extraer
    const extracted = extractZip(zipFile, outputDir);
    if (!extracted) {
      throw new Error('Failed to extract ZIP');
    }
    
    // 3. Mover node.exe
    const moved = moveNodeExecutable();
    if (!moved) {
      throw new Error('Failed to move node.exe');
    }
    
    // 4. Limpiar
    cleanup();
    
    // 5. Verificación final
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ NODE.JS PORTABLE READY');
    console.log('='.repeat(60));
    console.log('Location:', nodeExePath);
    console.log('Size:', `${(fs.statSync(nodeExePath).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    
    // Verificar que sea ejecutable
    if (process.platform === 'win32') {
      try {
        const version = execSync(`"${nodeExePath}" --version`, { encoding: 'utf8' }).trim();
        console.log('✅ Node.js version:', version);
      } catch (e) {
        console.error('⚠️  Could not verify Node.js executable');
      }
    }
    
    console.log('');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ ERROR');
    console.error('='.repeat(60));
    console.error(error.message);
    console.error('');
    
    // Mostrar contenido del directorio para debugging
    if (fs.existsSync(outputDir)) {
      console.error('Contents of output directory:');
      fs.readdirSync(outputDir).forEach(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        console.error(`  - ${file} (${stats.isDirectory() ? 'DIR' : (stats.size / 1024).toFixed(2) + ' KB'})`);
      });
    }
    
    process.exit(1);
  }
}

// Ejecutar
main();