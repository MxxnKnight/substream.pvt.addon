const scraper = require('../src/services/scraper');

async function testExtraction() {
    console.log("1. Fetching direct link from MSone Squid Game Page...");
    const directLink = await scraper.getDirectDownloadLink('https://malayalamsubtitles.org/languages/korean/squid-game-2021/', 'MSone');
    console.log("Direct Link extracted:", directLink);

    if (!directLink) return;

    console.log("\n2. Fetching buffer from direct link...");
    const fetch = require('node-fetch');
    const response = await fetch(directLink);
    let buffer = await response.arrayBuffer();
    buffer = Buffer.from(buffer);

    const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
    console.log("Is Zip Format?", isZip);

    if (isZip) {
        console.log("\n3. Extracting files...");
        const files = scraper.extractAllSrtsFromBuffer(buffer);
        console.log(`Extracted ${files.length} files.`);
        
        files.slice(0, 5).forEach(f => {
            const parsed = scraper.detectSeasonEpisode(f.name);
            console.log(` - ${f.name} -> S${parsed.season || '?'} E${parsed.episode || '?'}`);
        });
    }
}

testExtraction();
