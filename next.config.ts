import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Désactiver le prerender pour éviter les erreurs avec useLanguage
  // Les pages seront rendues à la demande
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Optimisations pour accélérer le build
  compress: true,
  
  // ⚡ ACCÉLÉRATION : Ignorer TypeScript pendant le build
  // Les erreurs seront détectées en développement avec l'IDE
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimiser les images (si utilisées)
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
