const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://malayalamsubtitles.org/tvshows/squid-game/');
  const html = await res.text();
  console.log("ZIP matches in HTML length:", html.length);
  const zipLinks = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.zip/gi)];
  console.log("Zip URLs found:");
  zipLinks.forEach(m => console.log(m[0]));
}
test();
