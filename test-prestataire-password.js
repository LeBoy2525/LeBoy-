// Script pour tester quel mot de passe correspond au hash d'un prestataire
const bcrypt = require('bcryptjs');

const prestataires = [
  {
    id: 2,
    email: 'christinehomecare1@gmail.com',
    passwordHash: '$2a$10$3e0.mh.z9UwzYpGk0eEPY.aC66SjZ2B/2vwOjSXcYu9PZVFx0sFmG',
    statut: 'actif'
  },
  {
    id: 3,
    email: 'nathanyves01@gmail.com',
    passwordHash: '$2a$10$YhvcIhwjDV8WTdBiGNPx1e4EOOPEopeClnH6SjJDz6JlB7AsRpjfe',
    statut: 'actif'
  },
  {
    id: 4,
    email: 'bibichet@gmail.com',
    passwordHash: '$2a$10$AL/iAE9Qv6H42glnVhLT.OTkY9CE28r87mhYHzMvCNOGJb4WCjrti',
    statut: 'actif'
  }
];

const commonPasswords = [
  'password',
  'password123',
  'test123',
  '12345678',
  'leboy123',
  'prestataire123',
  'admin123',
  'christine123',
  'nathan123',
  'bibiche123'
];

async function testPasswords() {
  console.log('🔍 Test des mots de passe pour les prestataires actifs\n');
  console.log('='.repeat(60));

  for (const prestataire of prestataires) {
    console.log(`\n📧 Prestataire: ${prestataire.email} (ID: ${prestataire.id})`);
    console.log(`Hash: ${prestataire.passwordHash.substring(0, 30)}...`);
    
    let found = false;
    for (const password of commonPasswords) {
      const match = await bcrypt.compare(password, prestataire.passwordHash);
      if (match) {
        console.log(`✅ Mot de passe trouvé: "${password}"`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`❌ Aucun mot de passe commun ne correspond`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

testPasswords().catch(console.error);

