const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

async function test() {
  const url = 'https://wp.malayalamsubtitles.in/download/1777';
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
  const res = await fetch(url, { headers });
  const text = await res.text();
  fs.writeFileSync('scratch/animal_page.html', text);
  console.log("Written to scratch/animal_page.html");
}
test().catch(console.error);
