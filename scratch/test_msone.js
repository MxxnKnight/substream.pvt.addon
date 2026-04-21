const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function test() {
    const url = 'https://malayalamsubtitles.org/languages/korean/squid-game-2021/';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log("=== Links containing 'zip' ===");
    $('a[href*=".zip"]').each((i, el) => console.log($(el).attr('href')));
    
    console.log("\n=== Links containing 'download' ===");
    $('a[href*="download"]').each((i, el) => console.log($(el).attr('href')));

    console.log("\n=== Links with text 'പരിഭാഷ' ===");
    $('a:contains("പരിഭാഷ")').each((i, el) => console.log($(el).attr('href')));

    console.log("\n=== Links pointing to drive ===");
    $('a[href*="drive.google"]').each((i, el) => console.log($(el).attr('href')));

    console.log("\n=== Checking for wp-content/uploads ===");
    $('a[href*="wp-content/uploads"]').each((i, el) => console.log($(el).attr('href')));
}

test();
