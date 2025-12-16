// Script de test pour vérifier les routes migrées vers Prisma
// Teste avec USE_DB=false (JSON) et USE_DB=true (Prisma)

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function logTest(name, status, details = "") {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  const color = status === "PASS" ? "green" : status === "FAIL" ? "red" : "yellow";
  log(`${icon} ${name}: ${status}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testRoute(method, path, options = {}) {
  try {
    const url = `${BASE_URL}${path}`;
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testAuth() {
  logSection("🔐 Tests d'Authentification");

  // Test 1: GET /api/auth/me (sans cookie)
  const test1 = await testRoute("GET", "/api/auth/me");
  logTest(
    "GET /api/auth/me (sans auth)",
    test1.success === false && test1.status === 401 ? "PASS" : "FAIL",
    `Status: ${test1.status}`
  );

  // Test 2: POST /api/auth/login (admin)
  const test2 = await testRoute("POST", "/api/auth/login", {
    body: {
      email: "contact@leboy.com",
      password: "admin123",
    },
  });
  const adminCookie = test2.headers["set-cookie"]?.[0] || "";
  logTest(
    "POST /api/auth/login (admin)",
    test2.success ? "PASS" : "FAIL",
    `Status: ${test2.status}, Cookie: ${adminCookie ? "✓" : "✗"}`
  );

  // Test 3: GET /api/auth/me (avec cookie admin)
  const test3 = await testRoute("GET", "/api/auth/me", {
    headers: {
      Cookie: adminCookie,
    },
  });
  logTest(
    "GET /api/auth/me (avec cookie admin)",
    test3.success && test3.data.role === "admin" ? "PASS" : "FAIL",
    `Status: ${test3.status}, Role: ${test3.data.role || "N/A"}`
  );

  return { adminCookie };
}

async function testDemandes(adminCookie) {
  logSection("📋 Tests des Routes Demandes");

  // Test 1: GET /api/demandes
  const test1 = await testRoute("GET", "/api/demandes");
  logTest(
    "GET /api/demandes",
    test1.success ? "PASS" : "FAIL",
    `Status: ${test1.status}, Demandes: ${test1.data.demandes?.length || 0}`
  );

  // Test 2: GET /api/admin/demandes/[id] (première demande)
  if (test1.data.demandes && test1.data.demandes.length > 0) {
    const firstDemandeId = test1.data.demandes[0].id;
    const test2 = await testRoute("GET", `/api/admin/demandes/${firstDemandeId}`, {
      headers: { Cookie: adminCookie },
    });
    logTest(
      `GET /api/admin/demandes/${firstDemandeId}`,
      test2.success && test2.data.demande ? "PASS" : "FAIL",
      `Status: ${test2.status}`
    );
  }

  // Test 3: GET /api/matching/[demandeId]
  if (test1.data.demandes && test1.data.demandes.length > 0) {
    const firstDemandeId = test1.data.demandes[0].id;
    const test3 = await testRoute("GET", `/api/matching/${firstDemandeId}`);
    logTest(
      `GET /api/matching/${firstDemandeId}`,
      test3.success ? "PASS" : "FAIL",
      `Status: ${test3.status}, Matches: ${test3.data.matches?.length || 0}`
    );
  }
}

async function testPrestataires(adminCookie) {
  logSection("👥 Tests des Routes Prestataires");

  // Test 1: GET /api/prestataires
  const test1 = await testRoute("GET", "/api/prestataires", {
    headers: { Cookie: adminCookie },
  });
  logTest(
    "GET /api/prestataires",
    test1.success ? "PASS" : "FAIL",
    `Status: ${test1.status}, Prestataires: ${test1.data.prestataires?.length || 0}, Stats: ${JSON.stringify(test1.data.stats || {})}`
  );

  // Test 2: GET /api/prestataires/[id]
  if (test1.data.prestataires && test1.data.prestataires.length > 0) {
    const firstPrestataireId = test1.data.prestataires[0].id;
    const test2 = await testRoute("GET", `/api/prestataires/${firstPrestataireId}`);
    logTest(
      `GET /api/prestataires/${firstPrestataireId}`,
      test2.success && test2.data.prestataire ? "PASS" : "FAIL",
      `Status: ${test2.status}`
    );
  }
}

async function testPropositions(adminCookie) {
  logSection("💼 Tests des Routes Propositions");

  // Test 1: GET /api/admin/demandes/[id]/propositions
  const testDemandes = await testRoute("GET", "/api/demandes");
  if (testDemandes.data.demandes && testDemandes.data.demandes.length > 0) {
    const firstDemandeId = testDemandes.data.demandes[0].id;
    const test1 = await testRoute("GET", `/api/admin/demandes/${firstDemandeId}/propositions`, {
      headers: { Cookie: adminCookie },
    });
    logTest(
      `GET /api/admin/demandes/${firstDemandeId}/propositions`,
      test1.success ? "PASS" : "FAIL",
      `Status: ${test1.status}, Propositions: ${test1.data.propositions?.length || 0}`
    );
  }
}

async function testMissions(adminCookie) {
  logSection("🚀 Tests des Routes Missions");

  // Test 1: GET /api/espace-client/missions
  const test1 = await testRoute("GET", "/api/espace-client/missions");
  logTest(
    "GET /api/espace-client/missions",
    test1.success || test1.status === 401 ? "PASS" : "FAIL",
    `Status: ${test1.status} (401 attendu si non authentifié)`
  );

  // Test 2: GET /api/prestataires/espace/missions
  const test2 = await testRoute("GET", "/api/prestataires/espace/missions");
  logTest(
    "GET /api/prestataires/espace/missions",
    test2.success || test2.status === 401 ? "PASS" : "FAIL",
    `Status: ${test2.status} (401 attendu si non authentifié)`
  );
}

async function runTests(useDb) {
  logSection(`🧪 Tests avec USE_DB=${useDb}`);
  log(`URL de base: ${BASE_URL}`, "blue");

  try {
    // Tests d'authentification
    const { adminCookie } = await testAuth();

    if (!adminCookie) {
      log("⚠️  Impossible d'obtenir le cookie admin, certains tests seront ignorés", "yellow");
    }

    // Tests des routes migrées
    await testDemandes(adminCookie);
    await testPrestataires(adminCookie);
    await testPropositions(adminCookie);
    await testMissions(adminCookie);

    logSection("✅ Tests terminés");
  } catch (error) {
    log(`❌ Erreur lors des tests: ${error.message}`, "red");
    console.error(error);
  }
}

// Fonction principale
async function main() {
  logSection("🧪 Tests de Migration Prisma");
  log(`Date: ${new Date().toISOString()}`, "blue");
  log(`Base URL: ${BASE_URL}`, "blue");

  // Test avec USE_DB=false (JSON)
  log("\n");
  log("=".repeat(60), "yellow");
  log("TEST 1: USE_DB=false (Mode JSON)", "yellow");
  log("=".repeat(60), "yellow");
  process.env.USE_DB = "false";
  await runTests(false);

  // Attendre un peu avant le prochain test
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test avec USE_DB=true (Prisma)
  log("\n");
  log("=".repeat(60), "yellow");
  log("TEST 2: USE_DB=true (Mode Prisma)", "yellow");
  log("=".repeat(60), "yellow");
  process.env.USE_DB = "true";
  await runTests(true);

  logSection("🎉 Tous les tests sont terminés");
}

// Exécuter les tests
main().catch((error) => {
  log(`❌ Erreur fatale: ${error.message}`, "red");
  process.exit(1);
});

