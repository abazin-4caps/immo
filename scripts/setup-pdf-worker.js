const fs = require('fs');
const path = require('path');
const https = require('https');

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, '../public'))) {
  fs.mkdirSync(path.join(__dirname, '../public'));
}

// URL du CDN pour le fallback
const CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.1.91/pdf.worker.min.js';

// Fonction pour télécharger le worker depuis le CDN
function downloadWorker(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function setupWorker() {
  const targetPath = path.join(__dirname, '../public/pdf.worker.min.js');

  // D'abord, essayer de copier depuis node_modules
  const possiblePaths = [
    '../node_modules/pdfjs-dist/build/pdf.worker.min.js',
    '../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js',
    '../node_modules/pdfjs-dist/webpack/pdf.worker.min.js'
  ];

  // Chercher le worker dans les chemins possibles
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

  try {
    if (workerPath) {
      // Copier depuis node_modules si trouvé
      fs.copyFileSync(workerPath, targetPath);
      console.log(`✅ PDF.js worker copié avec succès depuis: ${workerPath}`);
    } else {
      // Sinon, télécharger depuis le CDN
      console.log('Worker non trouvé localement, téléchargement depuis le CDN...');
      await downloadWorker(CDN_URL, targetPath);
      console.log('✅ PDF.js worker téléchargé avec succès depuis le CDN');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du PDF.js worker:', error);
    process.exit(1);
  }
}

setupWorker().catch(error => {
  console.error('❌ Erreur inattendue:', error);
  process.exit(1);
}); 