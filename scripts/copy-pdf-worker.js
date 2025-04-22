const fs = require('fs');
const path = require('path');
const https = require('https');

const targetFile = path.join(__dirname, '../public/pdf.worker.min.js');
const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/build/pdf.worker.min.js';

// Créer le dossier public s'il n'existe pas
if (!fs.existsSync(path.dirname(targetFile))) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
}

// Télécharger le worker
https.get(workerUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download worker: ${response.statusCode}`);
    process.exit(1);
  }

  const file = fs.createWriteStream(targetFile);
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('PDF.js worker downloaded successfully!');
  });
}).on('error', (err) => {
  console.error('Error downloading worker:', err.message);
  process.exit(1);
}); 