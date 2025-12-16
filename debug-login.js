// Script de debug pour vérifier le login prestataire
const http = require('http');
const querystring = require('querystring');

async function debugLogin(email, password) {
  return new Promise((resolve, reject) => {
    const formData = querystring.stringify({ email, password });

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
        console.log(`\n📧 Email: ${email}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.write(formData);
    req.end();
  });
}

async function run() {
  console.log('🔍 Debug Login Prestataire\n');
  
  // Test avec le prestataire de test
  await debugLogin('test-prestataire@leboy.com', 'test123456');
  
  // Test avec un prestataire existant actif
  await debugLogin('nathanyves01@gmail.com', 'password123');
  await debugLogin('bibichet@gmail.com', 'password123');
}

run().catch(console.error);

