// Script pour créer un prestataire de test dans la base de données Prisma
import { getPrestataireByEmail } from "./repositories/prestatairesRepo";
import { prisma } from "./lib/db";
import bcrypt from "bcryptjs";

async function createTestPrestataire() {
  try {
    const testEmail = 'test-prestataire@leboy.com';
    const testPassword = 'test123456';
    
    console.log('🔍 Connexion à la base de données...');
    
    // Vérifier si le prestataire existe déjà via le repository
    const existing = await getPrestataireByEmail(testEmail);
    
    if (existing) {
      console.log(`✅ Prestataire de test existe déjà: ${testEmail}`);
      
      // Mettre à jour le mot de passe et le statut si nécessaire
      // Utiliser Prisma directement avec un cast pour éviter les erreurs TypeScript
      const passwordHash = bcrypt.hashSync(testPassword, 10);
      
      const updated = await (prisma as any).prestataire.update({
        where: { id: existing.id },
        data: {
          passwordHash: passwordHash,
          statut: 'actif',
          deletedAt: null,
          actifAt: new Date(),
        },
      });
      
      console.log(`✅ Prestataire de test mis à jour:`);
      console.log(`  - ID: ${updated.id}`);
      console.log(`  - Email: ${updated.email}`);
      console.log(`  - Statut: ${updated.statut}`);
      console.log(`  - PasswordHash: ${updated.passwordHash ? 'présent' : 'absent'}`);
    } else {
      // Créer le prestataire de test
      const passwordHash = bcrypt.hashSync(testPassword, 10);
      
      // Générer une ref unique
      const count = await (prisma as any).prestataire.count();
      const ref = `P-2025-${String(count + 1).padStart(3, '0')}`;
      
      const prestataire = await (prisma as any).prestataire.create({
        data: {
          ref: ref,
          nomEntreprise: 'Test Prestataire SARL',
          nomContact: 'Test Contact',
          email: testEmail,
          phone: '237123456789',
          adresse: 'Yaoundé',
          ville: 'Yaoundé',
          specialites: ['administratif'],
          zonesIntervention: ['Yaoundé'],
          statut: 'actif',
          passwordHash: passwordHash,
          actifAt: new Date(),
        },
      });
      
      console.log(`✅ Prestataire de test créé:`);
      console.log(`  - ID: ${prestataire.id}`);
      console.log(`  - Ref: ${prestataire.ref}`);
      console.log(`  - Email: ${prestataire.email}`);
      console.log(`  - Statut: ${prestataire.statut}`);
      console.log(`  - PasswordHash: ${prestataire.passwordHash ? 'présent' : 'absent'}`);
    }
    
    console.log(`\n📝 Informations de test:`);
    console.log(`Email: ${testEmail}`);
    console.log(`Mot de passe: ${testPassword}`);
    console.log(`Statut: actif`);
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message || error);
    if (error.code === 'P1001') {
      console.error('💡 La base de données n\'est pas accessible. Vérifiez que Docker/PostgreSQL est démarré.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPrestataire();

