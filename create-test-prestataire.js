// Script pour créer un prestataire de test avec un mot de passe connu
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prestatairesFile = path.join(__dirname, 'data', 'prestataires.json');

// Lire les prestataires existants
let prestataires = [];
if (fs.existsSync(prestatairesFile)) {
  const content = fs.readFileSync(prestatairesFile, 'utf-8');
  prestataires = JSON.parse(content);
}

// Vérifier si le prestataire de test existe déjà
const testEmail = 'test-prestataire@leboy.com';
const existingIndex = prestataires.findIndex(p => p.email === testEmail);

// Mot de passe de test connu
const testPassword = 'test123456';
const passwordHash = bcrypt.hashSync(testPassword, 10);

const testPrestataire = {
  id: existingIndex >= 0 ? prestataires[existingIndex].id : (prestataires.length > 0 ? Math.max(...prestataires.map(p => p.id)) + 1 : 1),
  ref: `P-2025-${String(existingIndex >= 0 ? prestataires[existingIndex].id : prestataires.length + 1).padStart(3, '0')}`,
  createdAt: new Date().toISOString(),
  nomEntreprise: 'Test Prestataire SARL',
  nomContact: 'Test Contact',
  email: testEmail,
  phone: '237123456789',
  adresse: 'Yaoundé',
  ville: 'Yaoundé',
  specialites: ['administratif'],
  zonesIntervention: ['Yaoundé'],
  countries: ['CM'],
  certifications: ['Test'],
  anneeExperience: 5,
  tarifType: 'fixe',
  commissionICD: 15,
  capaciteMaxMissions: 5,
  passwordHash: passwordHash,
  statut: 'actif',
  documentsVerifies: true,
  disponibilite: 'disponible',
  noteMoyenne: 0,
  nombreMissions: 0,
  nombreMissionsReussies: 0,
  tauxReussite: 0,
  documents: []
};

if (existingIndex >= 0) {
  // Mettre à jour le prestataire existant
  prestataires[existingIndex] = testPrestataire;
  console.log(`✅ Prestataire de test mis à jour: ${testEmail}`);
} else {
  // Ajouter le nouveau prestataire
  prestataires.push(testPrestataire);
  console.log(`✅ Prestataire de test créé: ${testEmail}`);
}

// Sauvegarder
fs.writeFileSync(prestatairesFile, JSON.stringify(prestataires, null, 2), 'utf-8');

console.log(`\n📝 Informations de test:`);
console.log(`Email: ${testEmail}`);
console.log(`Mot de passe: ${testPassword}`);
console.log(`Statut: ${testPrestataire.statut}`);
console.log(`\n✅ Fichier sauvegardé: ${prestatairesFile}`);

