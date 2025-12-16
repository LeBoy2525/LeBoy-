// Script de test avec authentification complète
// Nécessite que le serveur soit démarré et que les données de test existent

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
    const cookies = response.headers.get("set-cookie") || "";

    return {
      success: response.ok,
      status: response.status,
      data,
      cookies,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testWithAuth() {
  logSection("🔐 Tests avec Authentification Complète");

  // Étape 1: Login admin
  log("\n1. Connexion admin...", "yellow");
  const loginResult = await testRoute("POST", "/api/auth/login", {
    body: {
      email: "contact@leboy.com",
      password: "admin123",
    },
  });

  if (!loginResult.success) {
    log(`   ❌ Échec de connexion: ${loginResult.status}`, "red");
    log(`   Réponse: ${JSON.stringify(loginResult.data)}`, "yellow");
    log("\n   ⚠️  Vérifiez que:", "yellow");
    log("   - Le serveur est démarré (npm run dev)", "yellow");
    log("   - Les credentials admin sont corrects", "yellow");
    log("   - L'utilisateur admin existe dans users.json ou la DB", "yellow");
    return;
  }

  log(`   ✅ Connexion réussie (Status: ${loginResult.status})`, "green");
  const adminCookie = loginResult.cookies.split(";")[0];

  // Étape 2: Vérifier /api/auth/me
  log("\n2. Vérification /api/auth/me...", "yellow");
  const meResult = await testRoute("GET", "/api/auth/me", {
    headers: {
      Cookie: adminCookie,
    },
  });

  if (meResult.success && meResult.data.role === "admin") {
    log(`   ✅ Rôle admin confirmé`, "green");
    log(`   Email: ${meResult.data.email || "N/A"}`, "cyan");
    log(`   Role: ${meResult.data.role}`, "cyan");
  } else {
    log(`   ⚠️  Rôle non confirmé: ${meResult.data.role || "N/A"}`, "yellow");
  }

  // Étape 3: Tester les routes admin
  log("\n3. Test des routes admin...", "yellow");
  
  // GET /api/admin/demandes/[id]
  const demandesResult = await testRoute("GET", "/api/demandes");
  if (demandesResult.data.demandes && demandesResult.data.demandes.length > 0) {
    const firstId = demandesResult.data.demandes[0].id;
    const adminDemandeResult = await testRoute("GET", `/api/admin/demandes/${firstId}`, {
      headers: { Cookie: adminCookie },
    });
    log(`   GET /api/admin/demandes/${firstId}: ${adminDemandeResult.success ? "✅" : "❌"} (${adminDemandeResult.status})`, adminDemandeResult.success ? "green" : "red");
  } else {
    log("   ⚠️  Aucune demande disponible pour tester", "yellow");
  }

  // GET /api/admin/demandes/[id]/propositions
  if (demandesResult.data.demandes && demandesResult.data.demandes.length > 0) {
    const firstId = demandesResult.data.demandes[0].id;
    const propositionsResult = await testRoute("GET", `/api/admin/demandes/${firstId}/propositions`, {
      headers: { Cookie: adminCookie },
    });
    log(`   GET /api/admin/demandes/${firstId}/propositions: ${propositionsResult.success ? "✅" : "❌"} (${propositionsResult.status})`, propositionsResult.success ? "green" : "red");
    log(`   Propositions trouvées: ${propositionsResult.data.propositions?.length || 0}`, "cyan");
  }

  // Étape 4: Tester les routes prestataires
  log("\n4. Test des routes prestataires...", "yellow");
  
  // Login prestataire (si existe)
  const prestataireLogin = await testRoute("POST", "/api/auth/login", {
    body: {
      email: "test-prestataire@leboy.com",
      password: "test123456",
    },
  });

  if (prestataireLogin.success) {
    log(`   ✅ Connexion prestataire réussie`, "green");
    const prestataireCookie = prestataireLogin.cookies.split(";")[0];

    // GET /api/prestataires/espace/propositions
    const prestPropositions = await testRoute("GET", "/api/prestataires/espace/propositions", {
      headers: { Cookie: prestataireCookie },
    });
    log(`   GET /api/prestataires/espace/propositions: ${prestPropositions.success ? "✅" : "❌"} (${prestPropositions.status})`, prestPropositions.success ? "green" : "red");
    log(`   Propositions: ${prestPropositions.data.propositions?.length || 0}`, "cyan");

    // GET /api/prestataires/espace/missions
    const prestMissions = await testRoute("GET", "/api/prestataires/espace/missions", {
      headers: { Cookie: prestataireCookie },
    });
    log(`   GET /api/prestataires/espace/missions: ${prestMissions.success ? "✅" : "❌"} (${prestMissions.status})`, prestMissions.success ? "green" : "red");
    log(`   Missions: ${prestMissions.data.missions?.length || 0}`, "cyan");
  } else {
    log(`   ⚠️  Prestataire de test non disponible (${prestataireLogin.status})`, "yellow");
  }

  logSection("✅ Tests avec authentification terminés");
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  logSection("🧪 Tests Complets avec Authentification");
  log(`Base URL: ${BASE_URL}`, "blue");
  log(`USE_DB: ${process.env.USE_DB || "non défini"}`, "blue");

  const serverOk = await checkServer();
  if (!serverOk) {
    log("\n❌ Le serveur n'est pas accessible", "red");
    log("   Démarrez le serveur avec: npm run dev", "yellow");
    process.exit(1);
  }

  log("\n✅ Serveur accessible", "green");
  await testWithAuth();
}

main().catch((error) => {
  log(`❌ Erreur: ${error.message}`, "red");
  process.exit(1);
});

