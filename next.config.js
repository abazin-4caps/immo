/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, 'bcrypt']
    
    // Configuration pour pdfjs-dist
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Configuration des alias de chemins
    config.resolve.alias['@'] = __dirname;

    return config
  },
  // Ajout de la configuration pour les images Cloudinary
  images: {
    domains: ['res.cloudinary.com'],
  },
  async headers() {
    return [
      {
        // Matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
}

module.exports = nextConfig
