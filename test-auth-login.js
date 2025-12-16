// Script de test pour /api/auth/login
const http = require('http');
const querystring = require('querystring');

function testLogin(testName, email, password, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const formData = querystring.stringify({
      email: email,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n${testName}:`);
        console.log(`Status: ${res.statusCode} (attendu: ${expectedStatus})`);
        console.log(`Response: ${data}`);
        
        // Vérifier les cookies
        const cookies = res.headers['set-cookie'] || [];
        const hasAuthCookie = cookies.some(c => c.includes('icd_auth=1'));
        const hasEmailCookie = cookies.some(c => c.includes('icd_user_email'));
        
        if (expectedStatus === 200) {
          console.log(`Cookies: icd_auth=${hasAuthCookie ? '✅' : '❌'}, icd_user_email=${hasEmailCookie ? '✅' : '❌'}`);
        }
        
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, cookies: { hasAuthCookie, hasEmailCookie } });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, cookies: { hasAuthCookie, hasEmailCookie } });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`\n${testName} - Error:`, error.message);
      reject(error);
    });

    req.write(formData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Tests de /api/auth/login\n');
  console.log('='.repeat(50));

  // Test A : Login admin (succès)
  await testLogin(
    'Test A: Login admin (succès)',
    'contact.icd-relay@gmail.com',
    'leboy-admin-2025',
    200
  );

  // Test B : Login admin (mauvais mot de passe)
  await testLogin(
    'Test B: Login admin (mauvais mot de passe)',
    'contact.icd-relay@gmail.com',
    'wrong-password',
    401
  );

  // Test C : Login prestataire (succès) - utilise le prestataire de test créé
  await testLogin(
    'Test C: Login prestataire (succès)',
    'test-prestataire@leboy.com',
    'test123456', // Mot de passe de test connu
    200
  );

  // Test D : Login prestataire (compte non trouvé)
  await testLogin(
    'Test D: Login prestataire (compte non trouvé)',
    'prestataire-inexistant@example.com',
    'password123',
    401
  );

  // Test E : Login client (succès) - nécessite un client avec email vérifié
  // Note: Vous devrez adapter l'email et le mot de passe selon vos données
  await testLogin(
    'Test E: Login client (succès)',
    'client@example.com',
    'password123', // Adaptez selon vos données
    200
  ).catch(() => {
    console.log('⚠️ Test E ignoré (client non disponible ou mot de passe inconnu)');
  });

  // Test F : Login client (email non vérifié)
  // Note: Nécessite un client avec emailVerified=false
  await testLogin(
    'Test F: Login client (email non vérifié)',
    'client-non-verifie@example.com',
    'password123',
    403
  ).catch(() => {
    console.log('⚠️ Test F ignoré (client non vérifié non disponible)');
  });

  // Test G : Email inconnu
  await testLogin(
    'Test G: Email inconnu',
    'inexistant@example.com',
    'password123',
    401
  );

  // Test H : Mauvais mot de passe (client)
  await testLogin(
    'Test H: Mauvais mot de passe',
    'client@example.com',
    'wrong-password',
    401
  ).catch(() => {
    console.log('⚠️ Test H ignoré (client non disponible)');
  });

  // Test I : Données manquantes
  await testLogin(
    'Test I: Email manquant',
    '',
    'password123',
    400
  );

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests terminés');
}

runTests().catch(console.error);

