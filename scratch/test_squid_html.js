const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/tvshows/squid-game/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("All links with 'download' or 'പരിഭാഷ':");
  $('a').each((i, el) => {
    const text = $(el).text().trim() || '';
    const href = $(el).attr('href') || '';
    const classN = $(el).attr('class') || '';
    
    if (text.includes('പരിഭാഷ') || href.includes('download') || classN.includes('elementor-button') || classN.includes('wp-block-button__link')) {
      console.log(`- Text: "${text}", Href: "${href}", Class: "${classN}"`);
    }
  });
}
test();
