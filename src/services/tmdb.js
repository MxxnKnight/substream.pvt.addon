
const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_URL = 'https://api.themoviedb.org/3';

const getMetadata = async (imdbId) => {
  if (!TMDB_API_KEY) return null;
  if (!imdbId || !imdbId.startsWith('tt')) return null;

  try {
    // TMDB find endpoint allows searching by external_ids (like IMDB)
    const res = await fetch(`${TMDB_URL}/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
    if (!res.ok) return null;

    const data = await res.json();
    
    // Check results in movies, tv_results, etc.
    const movie = data.movie_results?.[0];
    const tv = data.tv_results?.[0] || data.tv_episode_results?.[0];
    const result = movie || tv;
    
    if (result) {
      return {
        title: result.title || result.name,
        poster_path: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
        release_date: result.release_date || result.first_air_date,
        overview: result.overview,
        type: movie ? 'movie' : 'series'
      };
    }
    return null;
  } catch (err) {
    console.error('[TMDB] Error fetching metadata:', err);
    return null;
  }
};

const searchByTitle = async (title) => {
  if (!TMDB_API_KEY || !title) return null;
  try {
    let cleanTitle = typeof title === 'string' ? title : '';
    // Strip common extensions and episode codes
    cleanTitle = cleanTitle.replace(/\.(srt|vtt|zip|rar)$/gi, ' ');
    cleanTitle = cleanTitle.replace(/[sS]\d{1,2}[eE]\d{1,2}|[sS]\d{1,2}/g, ' ');
    // Strip common release tags and language marks
    cleanTitle = cleanTitle.replace(/[._-]/g, ' ').replace(/1080p|720p|480p|WEBRip|HDRip|x264|BluRay|Malayalam|Subtitle/gi, ' ');
    // Remove bracketed info [MSone], (2023) etc.
    cleanTitle = cleanTitle.replace(/\[.*?\]|\(.*?\)/g, ' ').trim();
    // Collapse spaces
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
    
    if (!cleanTitle) return null;
    console.log(`[TMDB] Searching by cleaned title: ${cleanTitle}`);
    
    const searchRes = await fetch(`${TMDB_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`);
    if (!searchRes.ok) return null;
    
    const data = await searchRes.json();
    const result = data.results?.[0];
    if (result && (result.media_type === 'movie' || result.media_type === 'tv')) {
      const type = result.media_type === 'tv' ? 'tv' : 'movie';
      const idRes = await fetch(`${TMDB_URL}/${type}/${result.id}/external_ids?api_key=${TMDB_API_KEY}`);
      if (idRes.ok) {
         const idData = await idRes.json();
         if (idData.imdb_id) {
            return {
               imdbId: idData.imdb_id,
               type: type === 'tv' ? 'series' : 'movie',
               title: result.title || result.name
            };
         }
      }
    }
    return null;
  } catch (err) {
    console.error('[TMDB] Search by title error:', err);
    return null;
  }
};

module.exports = { getMetadata, searchByTitle };
