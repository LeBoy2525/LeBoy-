/**
 * Script de diagnostic pour comprendre pourquoi l'utilisateur n'est pas trouvé
 * 
 * Usage: npx tsx scripts/diagnose-user-issue.ts <email>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function diagnose(email: string) {
  console.log("=".repeat(80));
  console.log("🔍 DIAGNOSTIC UTILISATEUR");
  console.log("=".repeat(80));
  console.log(`Email recherché: "${email}"`);
  console.log(`Email normalisé: "${email.toLowerCase()}"`);
  console.log("");

  try {
    // 1. Vérifier la connexion DB
    console.log("1️⃣ Vérification connexion DB...");
    await prisma.$connect();
    console.log("✅ Connexion DB OK");
    console.log("");

    // 2. Vérifier si la table existe
    console.log("2️⃣ Vérification table 'users'...");
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `;
      console.log("✅ Table 'users' existe:", tableInfo);
    } catch (error: any) {
      console.error("❌ Erreur vérification table:", error.message);
    }
    console.log("");

    // 3. Lister tous les utilisateurs
    console.log("3️⃣ Liste de tous les utilisateurs dans la DB...");
    try {
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      console.log(`✅ ${allUsers.length} utilisateur(s) trouvé(s):`);
      allUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (ID: ${u.id}, Vérifié: ${u.emailVerified})`);
      });
      if (allUsers.length === 0) {
        console.log("⚠️ Aucun utilisateur dans la DB!");
      }
    } catch (error: any) {
      console.error("❌ Erreur liste utilisateurs:", error.message);
      console.error("   Stack:", error.stack);
    }
    console.log("");

    // 4. Rechercher l'utilisateur exact
    console.log(`4️⃣ Recherche utilisateur avec email exact: "${email.toLowerCase()}"`);
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (user) {
        console.log("✅ Utilisateur trouvé!");
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nom: ${user.fullName}`);
        console.log(`   Vérifié: ${user.emailVerified}`);
        console.log(`   Créé le: ${user.createdAt}`);
      } else {
        console.log("❌ Utilisateur NON trouvé avec email exact");
      }
    } catch (error: any) {
      console.error("❌ Erreur recherche utilisateur:", error.message);
    }
    console.log("");

    // 5. Recherche partielle (si email contient @)
    if (email.includes("@")) {
      const [localPart, domain] = email.split("@");
      console.log(`5️⃣ Recherche partielle (local: "${localPart}", domain: "${domain}")...`);
      try {
        const users = await prisma.user.findMany({
          where: {
            email: {
              contains: localPart,
            },
          },
        });
        if (users.length > 0) {
          console.log(`⚠️ ${users.length} utilisateur(s) trouvé(s) avec partie locale similaire:`);
          users.forEach((u) => {
            console.log(`   - ${u.email} (différence: "${u.email}" vs "${email.toLowerCase()}")`);
          });
        } else {
          console.log("❌ Aucun utilisateur avec partie locale similaire");
        }
      } catch (error: any) {
        console.error("❌ Erreur recherche partielle:", error.message);
      }
      console.log("");
    }

    // 6. Vérifier les variables d'environnement
    console.log("6️⃣ Variables d'environnement...");
    console.log(`   USE_DB: ${process.env.USE_DB}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "définie" : "NON définie"}`);
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      const masked = dbUrl.replace(/:[^:@]+@/, ":****@");
      console.log(`   DATABASE_URL (masquée): ${masked.substring(0, 50)}...`);
    }
    console.log("");

    // 7. Test de création (si utilisateur n'existe pas)
    console.log("7️⃣ Test de création d'un utilisateur de test...");
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testUser = await prisma.user.create({
        data: {
          email: testEmail,
          passwordHash: "test",
          fullName: "Test User",
          role: "client",
          emailVerified: false,
        },
      });
      console.log(`✅ Utilisateur test créé: ${testUser.email} (ID: ${testUser.id})`);

      // Vérifier immédiatement
      const verifyTest = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      if (verifyTest) {
        console.log("✅ Utilisateur test retrouvable immédiatement");
      } else {
        console.error("❌ ERREUR: Utilisateur test NON retrouvable!");
      }

      // Nettoyer
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log("✅ Utilisateur test supprimé");
    } catch (error: any) {
      console.error("❌ Erreur test création:", error.message);
      console.error("   Code:", error.code);
      console.error("   Stack:", error.stack);
    }

  } catch (error: any) {
    console.error("❌ Erreur générale:", error.message);
    console.error("   Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
    console.log("");
    console.log("=".repeat(80));
    console.log("✅ Diagnostic terminé");
    console.log("=".repeat(80));
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/diagnose-user-issue.ts <email>");
  process.exit(1);
}

diagnose(email).catch(console.error);

