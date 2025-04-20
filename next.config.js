/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, 'bcrypt']
    return config
  },
  // Ajout de la configuration pour les images Cloudinary
  images: {
    domains: ['res.cloudinary.com'],
  },
}

module.exports = nextConfig
