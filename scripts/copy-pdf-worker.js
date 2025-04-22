const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const targetFile = path.join(__dirname, '../public/pdf.worker.min.js');

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.dirname(targetFile))) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
}

// Copier le fichier
fs.copyFileSync(sourceFile, targetFile);

console.log('PDF.js worker copied successfully!'); 