// scripts/prisma-generate.js
// Script wrapper pour prisma generate qui gère l'absence de DATABASE_URL
// DATABASE_URL n'est pas requis pour prisma generate (génération du client uniquement)

const { execSync } = require('child_process');

// Définir DATABASE_URL avec une valeur factice si elle n'existe pas
// Prisma generate n'a pas besoin de se connecter à la base de données réelle
// Cette valeur sera utilisée uniquement pour satisfaire la validation de Prisma
const fakeDatabaseUrl = 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public';

// Créer un environnement avec DATABASE_URL définie (même si factice)
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || fakeDatabaseUrl
};

if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL non définie, utilisation d\'une valeur factice pour prisma generate');
}

try {
  console.log('🔧 Génération du client Prisma...');
  // Utiliser l'environnement avec DATABASE_URL définie
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: env
  });
  console.log('✅ Client Prisma généré avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la génération Prisma');
  console.error('Message:', error.message);
  
  // Ne pas faire échouer le build - le script vercel-build réessayera avec la vraie DATABASE_URL
  // Prisma generate peut échouer ici sans problème car il sera réessayé dans vercel-build
  console.warn('⚠️  Le build continuera - prisma generate sera réessayé dans vercel-build avec DATABASE_URL');
  process.exit(0);
}

