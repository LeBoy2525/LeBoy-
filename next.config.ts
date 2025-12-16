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
};

export default nextConfig;
