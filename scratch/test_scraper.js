const scraper = require('../src/services/scraper');

async function test() {
  console.log("Searching for Animal...");
  const results = await scraper.searchMalayalamSubtitlesIn('Animal');
  console.log("Search Results (MSin):", results);

  const animalResult = results.find(r => r.title.toLowerCase().includes('animal'));
  if (!animalResult) {
    console.log("Animal not found in search results.");
    return;
  }

  console.log("Animal link:", animalResult.link);

  console.log("Testing getMetadataFromPage...");
  const metadata = await scraper.getMetadataFromPage(animalResult.link);
  console.log("Metadata:", metadata);

  console.log("Testing getDirectDownloadLink...");
  const dlLink = await scraper.getDirectDownloadLink(animalResult.link, 'MalayalamSubtitles.in');
  console.log("Download Link:", dlLink);
}

test().catch(console.error);
