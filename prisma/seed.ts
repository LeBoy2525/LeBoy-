/**
 * Seed script pour initialiser la base de données avec des données minimales
 * 
 * Usage: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...\n");

  // 1. Créer l'utilisateur admin
  console.log("📦 Création de l'utilisateur admin...");
  const adminPasswordHash = await bcrypt.hash(
    process.env.ICD_ADMIN_PASSWORD || "leboy-admin-2025",
    10
  );
  
  const adminEmail = process.env.ICD_ADMIN_EMAIL || "contact@leboy.com";
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: "Administrateur LeBoy",
      role: "admin",
      emailVerified: true,
    },
  });
  console.log(`✅ Admin créé : ${admin.email}`);

  // 2. Créer les pays
  console.log("\n📦 Création des pays...");
  const countries = [
    { code: "CM", name: "Cameroun" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "SN", name: "Sénégal" },
    { code: "CA", name: "Canada" },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log(`✅ ${countries.length} pays créés`);

  // 3. Créer les catégories de services
  console.log("\n📦 Création des catégories de services...");
  const categories = [
    {
      name: "Administratif & Gouvernemental",
      description: "Services administratifs et gouvernementaux",
    },
    {
      name: "Immobilier & Foncier",
      description: "Services immobiliers et fonciers",
    },
    {
      name: "Financier & Fiscal",
      description: "Services financiers et fiscaux",
    },
    {
      name: "Santé & Assistance",
      description: "Services de santé et d'assistance",
    },
    {
      name: "Logistique & Livraison",
      description: "Services de logistique et livraison",
    },
    {
      name: "Entrepreneuriat & Projets",
      description: "Services d'entrepreneuriat et gestion de projets",
    },
  ];

  for (const category of categories) {
    const existing = await prisma.serviceCategory.findFirst({
      where: { name: category.name },
    });
    
    if (!existing) {
      await prisma.serviceCategory.create({
        data: category,
      });
    }
  }
  console.log(`✅ ${categories.length} catégories créées`);

  // 4. Créer les configurations de commission
  console.log("\n📦 Création des configurations de commission...");
  const commissionConfigs = [
    {
      categoryId: "administratif_government",
      categoryName: "Administratif & Gouvernemental",
      basePercent: 15.0,
      minCommission: 1000,
      maxCommission: 25000,
      riskPercent: 3.0,
      enabled: true,
    },
    {
      categoryId: "immobilier_foncier",
      categoryName: "Immobilier & Foncier",
      basePercent: 12.0,
      minCommission: 2000,
      maxCommission: 50000,
      riskPercent: 2.5,
      enabled: true,
    },
    {
      categoryId: "financier_fiscal",
      categoryName: "Financier & Fiscal",
      basePercent: 18.0,
      minCommission: 1500,
      maxCommission: 30000,
      riskPercent: 4.0,
      enabled: true,
    },
    {
      categoryId: "sante_assistance",
      categoryName: "Santé & Assistance",
      basePercent: 20.0,
      minCommission: 2000,
      maxCommission: 40000,
      riskPercent: 5.0,
      enabled: true,
    },
    {
      categoryId: "logistique_livraison",
      categoryName: "Logistique & Livraison",
      basePercent: 10.0,
      minCommission: 800,
      maxCommission: 20000,
      riskPercent: 2.0,
      enabled: true,
    },
    {
      categoryId: "entrepreneuriat_projets",
      categoryName: "Entrepreneuriat & Projets",
      basePercent: 15.0,
      minCommission: 1000,
      maxCommission: 25000,
      riskPercent: 3.0,
      enabled: true,
    },
  ];

  for (const config of commissionConfigs) {
    await prisma.commissionConfig.upsert({
      where: { categoryId: config.categoryId },
      update: {},
      create: config,
    });
  }
  console.log(`✅ ${commissionConfigs.length} configurations de commission créées`);

  console.log("\n✅ Seed terminé avec succès !");
  console.log(`\n📧 Admin: ${adminEmail}`);
  console.log(`🔑 Mot de passe par défaut: ${process.env.ICD_ADMIN_PASSWORD || "leboy-admin-2025"}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

