import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pour le moment on désactive le React Compiler
  // Tu pourras le réactiver plus tard si besoin.
  // reactCompiler: true,
  
  // Désactiver le prerender pour éviter les erreurs avec useLanguage
  // Les pages seront rendues à la demande
  experimental: {
    // Désactiver certaines optimisations qui peuvent causer des problèmes avec SSR
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Optimisations pour accélérer le build
  compress: true,
  
  // Optimisations de compilation TypeScript
  typescript: {
    // Ignorer les erreurs TypeScript pendant le build (à activer seulement si nécessaire)
    // ignoreBuildErrors: false,
  },
  
  // ESLint est désactivé pendant le build pour accélérer
  // Les erreurs seront détectées en développement avec `npm run lint`
  
  // Réduire la taille du bundle
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/**/*.wasm'],
  },
  
  // Optimiser les images (si utilisées)
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
