const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
const targetFile = path.join(__dirname, '../public/pdf.worker.min.mjs');

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.dirname(targetFile))) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
}

// Copier le worker
try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('PDF.js worker copied successfully!');
} catch (err) {
  console.error('Error copying worker:', err.message);
  process.exit(1);
} 