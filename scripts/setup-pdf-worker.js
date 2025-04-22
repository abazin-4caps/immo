const fs = require('fs');
const path = require('path');

// Chemins possibles pour le worker
const possibleSourcePaths = [
  path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js'),
  path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.js'),
  path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js'),
  path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.js')
];

const targetDir = path.join(__dirname, '../public');
const targetFile = path.join(targetDir, 'pdf.worker.js');

console.log('Setting up PDF.js worker...');
console.log('Target directory:', targetDir);
console.log('Target file:', targetFile);

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  console.log('Creating public directory...');
  fs.mkdirSync(targetDir, { recursive: true });
}

// Essayer chaque chemin possible jusqu'à en trouver un qui fonctionne
let workerFound = false;
for (const sourcePath of possibleSourcePaths) {
  console.log('Trying source path:', sourcePath);
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, targetFile);
      console.log('PDF.js worker copied successfully from:', sourcePath);
      workerFound = true;
      break;
    } catch (err) {
      console.error('Error copying from', sourcePath, ':', err.message);
    }
  } else {
    console.log('Source path does not exist:', sourcePath);
  }
}

if (!workerFound) {
  console.error('Could not find PDF.js worker in any of the expected locations');
  console.error('Contents of node_modules/pdfjs-dist:', fs.readdirSync(path.join(__dirname, '../node_modules/pdfjs-dist')));
  process.exit(1);
} 