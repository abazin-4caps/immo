const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.js');
const targetDir = path.join(__dirname, '../public');
const targetFile = path.join(targetDir, 'pdf.worker.js');

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copier le worker
try {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('PDF.js worker copied successfully!');
} catch (err) {
  console.error('Error copying worker:', err.message);
  process.exit(1);
} 