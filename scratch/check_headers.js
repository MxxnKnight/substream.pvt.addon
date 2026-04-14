const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
async function test() {
  const url = 'https://wp.malayalamsubtitles.in/download/1777';
  const headers = { 'User-Agent': 'Mozilla/5.0' };
  const res = await fetch(url, { headers, method: 'HEAD' });
  console.log('Status:', res.status, res.statusText);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Disposition:', res.headers.get('content-disposition'));
  console.log('Redirected URL:', res.url);
}
test().catch(console.error);
