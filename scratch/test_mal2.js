const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function testAll() {
    console.log("=== Testing searchMalayalamSubtitlesIn with ?s= ===");
    const url = 'https://malayalamsubtitles.in/?s=squid'; 
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    let $ = cheerio.load(html);
    
    $('article').each((i, el) => {
        const title = $(el).find('h2 a').text().trim() || $(el).find('h3 a').text().trim() || $(el).text().substring(0, 50).replace(/\n/g,'').trim();
        const link = $(el).find('a').attr('href');
        const img = $(el).find('img').attr('src');
        console.log(`MAL: ${title} | Link: ${link} | Img: ${img}`);
    });
    
    console.log("\n=== Testing MovieMirror search with ?s= === ");
    const mmurl = 'https://moviemirrorsubtitles.com/?s=squid'; 
    const mmres = await fetch(mmurl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const mmhtml = await mmres.text();
    $ = cheerio.load(mmhtml);
    
    $('article').each((i, el) => {
        const title = $(el).find('h2 a').text().trim() || $(el).find('.entry-title a').text().trim();
        const link = $(el).find('a').attr('href');
        const img = $(el).find('img').attr('src');
        if (title) console.log(`MM: ${title} | Link: ${link} | Img: ${img}`);
    });
}
testAll();
