#!/bin/bash
# Script optimisé pour le build Vercel
# Évite de refaire les migrations si elles sont déjà appliquées

set -e

echo "🔧 Vérification des migrations Prisma..."

# Vérifier si les migrations sont nécessaires
# Si DATABASE_URL n'est pas disponible, on skip les migrations
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL non définie, skip des migrations"
else
  # Appliquer les migrations (seulement si nécessaire)
  echo "📦 Application des migrations Prisma..."
  npx prisma migrate deploy || {
    echo "⚠️  Erreur lors des migrations, continuation du build..."
  }
fi

echo "🏗️  Build Next.js..."
npm run build

