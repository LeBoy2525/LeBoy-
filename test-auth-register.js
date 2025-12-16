// Tests pour /api/auth/register
const http = require('http');
const querystring = require('querystring');

async function testRegister(formData) {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify(formData);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('🧪 Tests de /api/auth/register\n');
  console.log('='.repeat(60));

  // Test A: Inscription réussie
  console.log('\nTest A: Inscription réussie:');
  // Utiliser un email unique avec timestamp pour éviter les conflits
  const uniqueEmail = `test-register-${Date.now()}@example.com`;
  const resultA = await testRegister({
    fullName: 'Test User',
    email: uniqueEmail,
    password: 'password123',
    country: 'CM'
  });
  console.log(`Status: ${resultA.status} (attendu: 201)`);
  console.log(`Response: ${JSON.stringify(resultA.data)}`);
  
  // Utiliser cet email pour le Test B
  const testEmail = uniqueEmail;

  // Test B: Email déjà utilisé
  console.log('\nTest B: Email déjà utilisé:');
  const resultB = await testRegister({
    fullName: 'Test User 2',
    email: testEmail, // Même email que Test A
    password: 'password123',
    country: 'CM'
  });
  console.log(`Status: ${resultB.status} (attendu: 409)`);
  console.log(`Response: ${JSON.stringify(resultB.data)}`);

  // Test C: Champs manquants
  console.log('\nTest C: Champs manquants:');
  const resultC = await testRegister({
    fullName: 'Test User',
    // email manquant
    password: 'password123'
  });
  console.log(`Status: ${resultC.status} (attendu: 400)`);
  console.log(`Response: ${JSON.stringify(resultC.data)}`);

  // Test D: Email invalide
  console.log('\nTest D: Email invalide:');
  const resultD = await testRegister({
    fullName: 'Test User',
    email: 'invalid-email',
    password: 'password123',
    country: 'CM'
  });
  console.log(`Status: ${resultD.status} (attendu: 400)`);
  console.log(`Response: ${JSON.stringify(resultD.data)}`);

  // Test E: Mot de passe trop court
  console.log('\nTest E: Mot de passe trop court:');
  const resultE = await testRegister({
    fullName: 'Test User',
    email: 'test-short-password@example.com',
    password: '1234567', // 7 caractères seulement
    country: 'CM'
  });
  console.log(`Status: ${resultE.status} (attendu: 400)`);
  console.log(`Response: ${JSON.stringify(resultE.data)}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés');
}

run().catch(console.error);

