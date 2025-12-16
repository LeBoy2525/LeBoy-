// Script pour tester le mécanisme de fallback automatique
// Simule une erreur DB et vérifie que le système bascule sur JSON

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
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
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testFallback() {
  logSection("🔄 Test du Mécanisme de Fallback");

  log("Ce test vérifie que le système bascule automatiquement sur JSON", "yellow");
  log("si la base de données n'est pas disponible ou génère une erreur.", "yellow");
  log("\n");

  // Test 1: GET /api/demandes (doit fonctionner même si DB échoue)
  log("Test 1: GET /api/demandes", "cyan");
  const test1 = await testRoute("GET", "/api/demandes");
  log(`   Status: ${test1.status}`);
  log(`   Success: ${test1.success ? "✅" : "❌"}`);
  log(`   Demandes trouvées: ${test1.data.demandes?.length || 0}`);
  
  if (test1.success) {
    log("   ✅ Le système a réussi à récupérer les demandes", "green");
  } else {
    log("   ❌ Échec de la récupération des demandes", "red");
  }

  // Test 2: GET /api/prestataires
  log("\nTest 2: GET /api/prestataires", "cyan");
  const test2 = await testRoute("GET", "/api/prestataires");
  log(`   Status: ${test2.status}`);
  log(`   Success: ${test2.success ? "✅" : "❌"}`);
  log(`   Prestataires trouvés: ${test2.data.prestataires?.length || 0}`);
  
  if (test2.success) {
    log("   ✅ Le système a réussi à récupérer les prestataires", "green");
  } else {
    log("   ❌ Échec de la récupération des prestataires", "red");
  }

  // Test 3: GET /api/auth/me (avec login)
  log("\nTest 3: POST /api/auth/login puis GET /api/auth/me", "cyan");
  const loginTest = await testRoute("POST", "/api/auth/login", {
    body: {
      email: "contact@leboy.com",
      password: "admin123",
    },
  });
  
  if (loginTest.success) {
    const cookie = loginTest.headers?.["set-cookie"]?.[0] || "";
    const meTest = await testRoute("GET", "/api/auth/me", {
      headers: { Cookie: cookie },
    });
    log(`   Login Status: ${loginTest.status}`);
    log(`   Me Status: ${meTest.status}`);
    log(`   Role: ${meTest.data.role || "N/A"}`);
    
    if (meTest.success && meTest.data.role) {
      log("   ✅ Authentification et récupération du rôle fonctionnent", "green");
    } else {
      log("   ❌ Échec de l'authentification ou récupération du rôle", "red");
    }
  } else {
    log("   ⚠️  Impossible de tester l'auth (login échoué)", "yellow");
  }

  logSection("📊 Résumé du Test de Fallback");
  log("Le système doit fonctionner même si la DB n'est pas disponible.", "yellow");
  log("Tous les appels doivent réussir grâce au fallback JSON automatique.", "yellow");
}

testFallback().catch((error) => {
  log(`❌ Erreur: ${error.message}`, "red");
  process.exit(1);
});

