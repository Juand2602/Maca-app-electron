// scripts/download-node.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const NODE_VERSION = '20.11.0'; // Versión LTS
const PLATFORM = 'win';
const ARCH = 'x64';

const downloadUrl = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.zip`;
const outputDir = path.join(__dirname, '..', 'node-portable');
const zipFile = path.join(outputDir, 'node.zip');

console.log('📦 Downloading Node.js portable...');
console.log('Version:', NODE_VERSION);
console.log('URL:', downloadUrl);

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Descargar Node.js
const file = fs.createWriteStream(zipFile);

https.get(downloadUrl, (response) => {
  const totalSize = parseInt(response.headers['content-length'], 10);
  let downloadedSize = 0;

  response.on('data', (chunk) => {
    downloadedSize += chunk.length;
    const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
    process.stdout.write(`\rDownloading... ${progress}%`);
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n✅ Download completed');
    
    // Extraer ZIP
    console.log('📂 Extracting...');
    
    try {
      // Usar PowerShell para extraer en Windows
      const extractCmd = `powershell -command "Expand-Archive -Path '${zipFile}' -DestinationPath '${outputDir}' -Force"`;
      execSync(extractCmd);
      
      // Mover archivos al nivel correcto
      const extractedFolder = path.join(outputDir, `node-v${NODE_VERSION}-${PLATFORM}-${ARCH}`);
      
      if (fs.existsSync(extractedFolder)) {
        // Copiar solo node.exe
        const nodeExe = path.join(extractedFolder, 'node.exe');
        const destNodeExe = path.join(outputDir, 'node.exe');
        
        fs.copyFileSync(nodeExe, destNodeExe);
        console.log('✅ node.exe extracted');
        
        // Limpiar
        fs.rmSync(extractedFolder, { recursive: true, force: true });
        fs.unlinkSync(zipFile);
        
        console.log('✅ Node.js portable ready at:', outputDir);
        console.log('   Size:', (fs.statSync(destNodeExe).size / 1024 / 1024).toFixed(2), 'MB');
      }
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      process.exit(1);
    }
  });

}).on('error', (err) => {
  fs.unlinkSync(zipFile);
  console.error('❌ Download failed:', err);
  process.exit(1);
});