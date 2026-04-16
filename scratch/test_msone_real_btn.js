const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/movies/nocturnal-animals-2016/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('a').each((i, el) => {
    const text = $(el).text().trim() || '';
    const href = $(el).attr('href') || '';
    const classN = $(el).attr('class') || '';
    
    // Look for anything that might be a download button or zip file
    if (href.includes('.zip') || classN.includes('btn') || classN.includes('button') || text.includes('ഡൗൺലോഡ്')) {
      console.log(`- Text: "${text}", Href: "${href}", Class: "${classN}"`);
    }
  });
}
test();
