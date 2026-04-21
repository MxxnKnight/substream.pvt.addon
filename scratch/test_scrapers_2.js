const scraper = require('../src/services/scraper');
const adminController = require('../src/controllers/adminController');

async function testAll() {
    console.log("=== Testing MalayalamSubtitles.in ===");
    const mal = await scraper.searchMalayalamSubtitlesIn('squid');
    console.log("Results:", mal.slice(0, 1));
    
    console.log("\n=== Testing MovieMirror ===");
    const mm = await scraper.searchMovieMirror('squid');
    console.log("Results:", mm.slice(0, 1));

    console.log("\n=== Testing MSone ===");
    const ms = await scraper.searchMSone('squid');
    console.log("Results:", ms.slice(0, 1));
}

testAll();
