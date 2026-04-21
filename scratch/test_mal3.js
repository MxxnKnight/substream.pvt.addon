const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('scratch/mal_search.html', 'utf8');
const $ = cheerio.load(html);

console.log("=== Finding Squid in malayalamsubtitles.in HTML ===");
let found = false;

$('a').each((i, el) => {
    const text = $(el).text().trim();
    if (text.toLowerCase().includes('squid')) {
        console.log("Found text in link:", text);
        console.log("Link href:", $(el).attr('href'));
        console.log("Parent HTML class:", $(el).parent().attr('class'));
        
        const parentArticle = $(el).closest('article');
        if (parentArticle.length) {
            console.log("Article class:", parentArticle.attr('class'));
            console.log("Image src:", parentArticle.find('img').attr('src'));
        }
        
        const parentDiv = $(el).closest('div');
        if (parentDiv.length) {
             console.log("Div class:", parentDiv.attr('class'));
        }
        found = true;
    }
});

if (!found) {
    console.log("Squid not found anywhere in search results. The site might be using JS rendering or a different search architecture.");
}
