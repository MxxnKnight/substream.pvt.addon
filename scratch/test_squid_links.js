const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/tvshows/squid-game/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // Just print the first 20 links to see what is on the page
  console.log("FIRST 20 URLs:");
  $('a').slice(0, 20).each((i, el) => {
    console.log($(el).text().trim().replace(/\n/g, ''), " | HREF:", $(el).attr('href'));
  });
  
  // Let's try to find an episode list!
  console.log("\n\nEPISODE LINKS?:");
  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('episode')) {
      console.log($(el).text().trim(), " | HREF:", href);
    }
  });
}
test();
