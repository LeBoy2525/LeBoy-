#!/bin/bash

# Script pour exécuter tous les tests de migration
# Usage: ./test-all-migrations.sh

echo "🧪 Tests de Migration Prisma - Suite Complète"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier que le serveur est démarré
echo -e "${YELLOW}⚠️  Assurez-vous que le serveur Next.js est démarré (npm run dev)${NC}"
echo "Appuyez sur Entrée pour continuer..."
read

# Test 1: USE_DB=false (JSON)
echo ""
echo -e "${GREEN}Test 1: Mode JSON (USE_DB=false)${NC}"
echo "----------------------------------------"
USE_DB=false node test-migration-routes.js

# Attendre un peu
sleep 2

# Test 2: USE_DB=true (Prisma)
echo ""
echo -e "${GREEN}Test 2: Mode Prisma (USE_DB=true)${NC}"
echo "----------------------------------------"
USE_DB=true node test-migration-routes.js

# Test 3: Fallback mechanism
echo ""
echo -e "${GREEN}Test 3: Mécanisme de Fallback${NC}"
echo "----------------------------------------"
node test-fallback-mechanism.js

echo ""
echo -e "${GREEN}✅ Tous les tests sont terminés${NC}"

