const fetch = require('node-fetch');

async function test() {
  const downloadUrl = 'https://wp.malayalamsubtitles.in/download/1777';
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Failed to download subtitle from upstream: ${response.statusText}`);

  let buffer = await response.arrayBuffer();
  buffer = Buffer.from(buffer);
  console.log("Buffer size:", buffer.length);
}
test().catch(console.error);
