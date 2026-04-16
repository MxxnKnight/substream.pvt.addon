const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/tvshows/squid-game/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('a, button').each((i, el) => {
    const text = $(el).text().trim() || '';
    if (text === 'പരിഭാഷ') {
      console.log($(el).parent().html());
      console.log($(el).parent().parent().html());
    }
  });
}
test();
