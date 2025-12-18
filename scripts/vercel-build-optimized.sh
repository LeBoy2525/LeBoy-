#!/bin/bash
set -e

echo "🚀 Build optimisé pour Vercel"

# Générer Prisma Client (rapide)
echo "📦 Génération Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma --generator client || {
  echo "⚠️ Erreur Prisma generate, continuation..."
}

# Build Next.js avec Turbopack (plus rapide)
echo "🏗️ Build Next.js..."
SKIP_ENV_VALIDATION=true next build || {
  echo "❌ Erreur build, arrêt"
  exit 1
}

echo "✅ Build terminé avec succès"

