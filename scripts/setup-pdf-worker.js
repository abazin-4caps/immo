const fs = require('fs');
const path = require('path');

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// Chemins possibles pour le worker
const possiblePaths = [
  '../node_modules/pdfjs-dist/build/pdf.worker.min.js',
  '../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js',
  '../node_modules/pdfjs-dist/webpack/pdf.worker.min.js'
];

// Trouver le premier chemin valide
let workerPath = null;
for (const relativePath of possiblePaths) {
  const fullPath = path.join(__dirname, relativePath);
  console.log(`Vérification du chemin: ${fullPath}`);
  if (fs.existsSync(fullPath)) {
    workerPath = fullPath;
    console.log(`✅ Worker trouvé à: ${fullPath}`);
    break;
  }
}

if (!workerPath) {
  console.error('❌ Worker PDF.js introuvable dans les chemins suivants:');
  possiblePaths.forEach(p => console.error(`   - ${path.join(__dirname, p)}`));
  process.exit(1);
}

// Copier le worker
try {
  const targetPath = path.join(__dirname, '../public/pdf.worker.min.js');
  fs.copyFileSync(workerPath, targetPath);
  console.log(`✅ PDF.js worker copié avec succès vers: ${targetPath}`);
} catch (error) {
  console.error('❌ Erreur lors de la copie du PDF.js worker:', error);
  process.exit(1);
} 