// scripts/copy-assets.js
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../frontend/public/logo-maca.png');
const dest = path.join(__dirname, '../frontend/dist/logo-maca.png');

// Asegurarse de que el directorio dist existe
if (!fs.existsSync(path.dirname(dest))) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
}

// Copiar el archivo
fs.copyFileSync(source, dest);

console.log('✅ Logo copiado a dist/');