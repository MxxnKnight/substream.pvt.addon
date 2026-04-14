const fetch = require('node-fetch');

async function test() {
  const url = 'http://localhost:3000/api/admin/import-external';
  
  // NOTE: JWT authentication is required for this route!
  // Wait, I can't easily hit localhost:3000 if it requires a JWT token.
  // Let's just bypass the route manually by calling the controller directly.
}
test().catch(console.error);
