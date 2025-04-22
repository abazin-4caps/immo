const fs = require('fs');
const path = require('path');

// Créer le dossier public s'il n'existe pas
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Copier le worker depuis node_modules
const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const targetFile = path.join(__dirname, '../public/pdf.worker.min.js');

try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('✅ PDF.js worker copié avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la copie du PDF.js worker:', error);
  process.exit(1);
} 