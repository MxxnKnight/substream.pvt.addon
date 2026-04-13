
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
    const result = data.movie_results?.[0] || data.tv_results?.[0] || data.tv_episode_results?.[0];
    
    if (result) {
      return {
        title: result.title || result.name,
        poster_path: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
        release_date: result.release_date || result.first_air_date,
        overview: result.overview
      };
    }
    return null;
  } catch (err) {
    console.error('[TMDB] Error fetching metadata:', err);
    return null;
  }
};

module.exports = { getMetadata };
