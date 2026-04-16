require('dotenv').config();
const { importExternalSubtitle } = require('../src/controllers/adminController');
const scraper = require('../src/services/scraper');
const fetch = require('node-fetch');

async function test() {
  const url = "https://malayalamsubtitles.org/tvshows/squid-game/";
  const metadata = await scraper.getMetadataFromPage(url);
  const downloadUrl = await scraper.getDirectDownloadLink(url, "MSone");
  console.log("Download URL:", downloadUrl);
  
  const response = await fetch(downloadUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log("Buffer Length:", buffer.length);
  console.log("First 10 bytes:", buffer.slice(0, 10));
}

test().catch(console.error);
