const fs = require('fs');
const cheerio = require('cheerio');

async function testMal() {
    const fetch = require('node-fetch');
    const url = 'https://malayalamsubtitles.in/search-and-download/?title=squid'; // They use search queries
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log("=== Title Matches ===");
    $('h3, h2, h5, .title').each((i, el) => console.log($(el).text().trim()));
    
    console.log("=== Links ===");
    $('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (text.includes('Squid') || (href && href.includes('squid'))) {
            console.log(text, href);
        }
    });

    console.log("=== Images ===");
    $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('squid')) console.log(src);
    });

}

testMal();
