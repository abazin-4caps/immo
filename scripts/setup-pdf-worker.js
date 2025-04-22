const fs = require('fs');
const path = require('path');

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// Copier le worker depuis node_modules
try {
  fs.copyFileSync(
    path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js'),
    path.join(__dirname, '../public/pdf.worker.min.js')
  );
  console.log('✅ PDF.js worker copié avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la copie du PDF.js worker:', error);
  process.exit(1);
} 