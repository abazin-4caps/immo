const fs = require('fs');
const path = require('path');
const https = require('https');

const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const targetFile = path.join(__dirname, '../public/pdf.worker.min.js');
const cdnUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/build/pdf.worker.min.js';

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.dirname(targetFile))) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
}

// Fonction pour télécharger le worker depuis le CDN
function downloadWorker() {
  return new Promise((resolve, reject) => {
    console.log('Downloading PDF.js worker from CDN...');
    const file = fs.createWriteStream(targetFile);
    https.get(cdnUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('PDF.js worker downloaded successfully!');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(targetFile, () => {});
      reject(err);
    });
  });
}

// Essayer de copier le fichier local d'abord, sinon télécharger depuis le CDN
async function copyOrDownloadWorker() {
  try {
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log('PDF.js worker copied from local successfully!');
    } else {
      await downloadWorker();
    }
  } catch (err) {
    console.error('Error handling worker:', err.message);
    process.exit(1);
  }
}

copyOrDownloadWorker(); 