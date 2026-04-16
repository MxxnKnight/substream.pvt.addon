const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/movies/nocturnal-animals-2016/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('form').each((i, el) => {
    console.log("Form Action:", $(el).attr('action'));
    console.log($(el).html());
  });
}
test();
