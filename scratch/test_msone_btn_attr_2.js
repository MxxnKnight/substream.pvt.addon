const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/tvshows/squid-game/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('a').each((i, el) => {
    const classN = $(el).attr('class') || '';
    const text = $(el).text().trim();
    if (classN.includes('button')) {
      console.log(`Text: ${text}`);
      console.log($(el).attr());
    }
  });
}
test();
