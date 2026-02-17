
const { findSubtitles } = require('../services/db');

// Simple in-memory cache
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getSubtitles = async (req, res) => {
  const { type, id } = req.params;

  // Strip .json extension if present
  const idClean = id.replace('.json', '');

  // Stremio ID format:
  // Movie: tt1234567
  // Series: tt1234567:1:1 (imdb_id:season:episode)

  const parts = idClean.split(':');
  const imdb_id = parts[0];

  const s = parseInt(parts[1], 10);
  const season = !isNaN(s) ? s : null;

  const e = parseInt(parts[2], 10);
  const episode = !isNaN(e) ? e : null;

  // Check cache
  const cacheKey = `${type}:${idClean}`;
  const cached = cache[cacheKey];
  if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
    // console.log(`Serving from cache: ${cacheKey}`);
    return res.json(cached.data);
  }

  try {
    // Query database
    // Note: For series, we expect season and episode to be present.
    // For movies, season and episode will be null.
    // Our findSubtitles handles nulls by ignoring the filter, which is what we want for movies?
    // Wait, for movies we want to query where season IS NULL and episode IS NULL?
    // Or just filter by imdb_id?
    // Usually movies don't have season/episode in DB unless we stored them as null.
    // Let's assume movies are stored with null/undefined season/episode.
    // findSubtitles implementation: if (season !== null) query.eq('season', season).
    // If season is null, it doesn't filter by season.
    // This returns ALL subtitles for that imdb_id.
    // For movies, this is fine (as long as we don't have series subtitles mixed with movie imdb_id, which shouldn't happen).

    const subtitles = await findSubtitles({
      imdb_id,
      season,
      episode,
      type
    });

    const response = {
      subtitles: subtitles.map(sub => ({
        id: sub.id,
        lang: sub.language,
        url: sub.file_path
      }))
    };

    // Update cache
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: response
    };

    res.json(response);
  } catch (err) {
    console.error(`Error fetching subtitles for ${idClean}:`, err);
    // Return empty array instead of 500 to not break Stremio UI
    res.json({ subtitles: [] });
  }
};

module.exports = { getSubtitles };
