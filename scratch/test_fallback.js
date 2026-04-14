require('dotenv').config();
const fetch = require('node-fetch');

async function test() {
  const title = "ANIMAL – അനിമൽ (2023)";
  let cleanTitle = title.replace(/–|मलयालम|മലയാളം|പരിഭാഷ|Malayalam Subtitle|Malayalam/gi, '').trim();
  cleanTitle = cleanTitle.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  cleanTitle = cleanTitle.replace(/[^\w\s-]/gi, '').trim();
  console.log('Clean Title:', cleanTitle);

  const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`);
  console.log('Search Res Status:', searchRes.status);
  const data = await searchRes.json();
  const result = data.results?.[0];
  console.log('TMDB Result:', result);

  if (result) {
    const typeParam = result.media_type === 'tv' ? 'tv' : 'movie';
    const idRes = await fetch(`https://api.themoviedb.org/3/${typeParam}/${result.id}/external_ids?api_key=${process.env.TMDB_API_KEY}`);
    console.log('ID Res Status:', idRes.status);
    const idData = await idRes.json();
    console.log('IMDB ID:', idData.imdb_id);
  }
}

test().catch(console.error);
