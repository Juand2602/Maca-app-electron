#!/usr/bin/env node

/**
 * Script para crear releases automáticamente - Sistema Calzado
 * Uso: npm run release
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error(colorize(`❌ Error ejecutando: ${command}`, 'red'));
    console.error(error.message);
    process.exit(1);
  }
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log(colorize('\n🚀 Asistente de Release - Sistema Calzado\n', 'cyan'));

  // 1. Verificar que no haya cambios sin commitear
  const status = exec('git status --porcelain');
  if (status) {
    console.log(colorize('⚠️  Tienes cambios sin commitear:', 'yellow'));
    console.log(status);
    const continuar = await question('\n¿Deseas continuar de todos modos? (y/n): ');
    if (continuar.toLowerCase() !== 'y') {
      console.log(colorize('❌ Cancelado', 'red'));
      rl.close();
      process.exit(0);
    }
  }

  // 2. Verificar rama actual
  const currentBranch = exec('git branch --show-current');
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    console.log(colorize(`⚠️  Estás en la rama: ${currentBranch}`, 'yellow'));
    const continuar = await question('¿Deseas crear release desde esta rama? (y/n): ');
    if (continuar.toLowerCase() !== 'y') {
      console.log(colorize('❌ Cancelado', 'red'));
      rl.close();
      process.exit(0);
    }
  }

  // 3. Obtener versión actual
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
  );
  const currentVersion = packageJson.version;
  
  console.log(colorize(`\n📦 Versión actual: ${currentVersion}`, 'bright'));

  // 4. Sugerir nueva versión
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  console.log('\nOpciones de nueva versión:');
  console.log(colorize(`  1. Patch (${major}.${minor}.${patch + 1})`, 'green') + ' - Correcciones de bugs');
  console.log(colorize(`  2. Minor (${major}.${minor + 1}.0)`, 'yellow') + ' - Nuevas características');
  console.log(colorize(`  3. Major (${major + 1}.0.0)`, 'red') + ' - Cambios importantes');
  console.log(colorize(`  4. Personalizada`, 'blue') + ' - Especificar versión');

  const opcion = await question('\nSelecciona una opción (1-4): ');
  
  let newVersion;
  switch(opcion.trim()) {
    case '1':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case '2':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case '3':
      newVersion = `${major + 1}.0.0`;
      break;
    case '4':
      newVersion = await question('Ingresa la versión (ej: 1.2.3): ');
      newVersion = newVersion.trim();
      // Validar formato
      if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
        console.log(colorize('❌ Formato inválido. Usa el formato: X.Y.Z', 'red'));
        rl.close();
        process.exit(1);
      }
      break;
    default:
      console.log(colorize('❌ Opción inválida', 'red'));
      rl.close();
      process.exit(1);
  }

  // 5. Pedir mensaje de release
  const mensaje = await question(colorize('\n📝 Mensaje del release: ', 'cyan'));
  
  if (!mensaje.trim()) {
    console.log(colorize('❌ El mensaje no puede estar vacío', 'red'));
    rl.close();
    process.exit(1);
  }

  // 6. Confirmar
  console.log(colorize('\n📋 Resumen del Release:', 'bright'));
  console.log(`   ${colorize('Versión:', 'cyan')} ${currentVersion} → ${colorize(newVersion, 'green')}`);
  console.log(`   ${colorize('Tag:', 'cyan')} v${newVersion}`);
  console.log(`   ${colorize('Mensaje:', 'cyan')} ${mensaje}`);
  console.log(`   ${colorize('Rama:', 'cyan')} ${currentBranch}`);
  
  const confirmar = await question(colorize('\n¿Confirmar release? (y/n): ', 'yellow'));
  if (confirmar.toLowerCase() !== 'y') {
    console.log(colorize('❌ Cancelado', 'red'));
    rl.close();
    process.exit(0);
  }

  console.log(colorize('\n🔧 Procesando release...\n', 'cyan'));

  try {
    // 7. Actualizar package.json
    console.log('1️⃣  ' + colorize('Actualizando package.json...', 'blue'));
    packageJson.version = newVersion;
    fs.writeFileSync(
      path.join(__dirname, '../package.json'),
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    console.log('   ' + colorize('✓ package.json actualizado', 'green'));

    // 8. Commit del cambio de versión
    console.log('\n2️⃣  ' + colorize('Creando commit...', 'blue'));
    exec('git add package.json');
    exec(`git commit -m "chore: bump version to ${newVersion}"`);
    console.log('   ' + colorize('✓ Commit creado', 'green'));

    // 9. Crear tag
    console.log('\n3️⃣  ' + colorize('Creando tag...', 'blue'));
    exec(`git tag -a v${newVersion} -m "${mensaje}"`);
    console.log('   ' + colorize(`✓ Tag v${newVersion} creado`, 'green'));

    // 10. Push
    console.log('\n4️⃣  ' + colorize('Subiendo a GitHub...', 'blue'));
    exec(`git push origin ${currentBranch}`);
    console.log('   ' + colorize(`✓ Cambios subidos a ${currentBranch}`, 'green'));
    
    exec(`git push origin v${newVersion}`);
    console.log('   ' + colorize(`✓ Tag v${newVersion} subido`, 'green'));

    // 11. Obtener información del repositorio
    let repoUrl = '';
    try {
      const remoteUrl = exec('git config --get remote.origin.url');
      // Convertir SSH o HTTPS a URL web
      repoUrl = remoteUrl
        .replace('git@github.com:', 'https://github.com/')
        .replace('.git', '');
    } catch (e) {
      // Si falla, usar un placeholder
      repoUrl = 'https://github.com/TU_USUARIO/TU_REPO';
    }

    console.log(colorize('\n✅ ¡Release creado exitosamente!', 'green'));
    console.log(colorize('\n📦 Información del Release:', 'bright'));
    console.log(`   ${colorize('Versión:', 'cyan')} v${newVersion}`);
    console.log(`   ${colorize('Tag:', 'cyan')} v${newVersion}`);
    console.log(`   ${colorize('Mensaje:', 'cyan')} ${mensaje}`);
    
    console.log(colorize('\n🔗 Enlaces:', 'bright'));
    console.log(`   Releases: ${colorize(repoUrl + '/releases', 'blue')}`);
    console.log(`   Actions:  ${colorize(repoUrl + '/actions', 'blue')}`);
    
    console.log(colorize('\n⏳ GitHub Actions está compilando el ejecutable...', 'yellow'));
    console.log(colorize('   Esto puede tardar 5-10 minutos', 'yellow'));
    console.log(colorize('\n💡 Tip: Revisa el progreso en GitHub Actions', 'cyan'));

  } catch (error) {
    console.error(colorize('\n❌ Error durante el release:', 'red'));
    console.error(error.message);
    
    // Intentar revertir cambios si algo falló
    console.log(colorize('\n🔄 Intentando revertir cambios...', 'yellow'));
    try {
      exec('git reset HEAD~1');
      exec(`git tag -d v${newVersion}`);
      console.log(colorize('✓ Cambios revertidos', 'green'));
    } catch (revertError) {
      console.log(colorize('⚠️  No se pudieron revertir todos los cambios', 'yellow'));
    }
    
    rl.close();
    process.exit(1);
  }
  
  rl.close();
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log(colorize('\n\n❌ Proceso cancelado por el usuario', 'red'));
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error(colorize('\n❌ Error inesperado:', 'red'));
  console.error(error);
  rl.close();
  process.exit(1);
});