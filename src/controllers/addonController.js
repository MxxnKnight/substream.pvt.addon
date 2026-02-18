
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
    return res.json(cached.data);
  }

  try {
    // Query database
    // Note: We ignore 'type' parameter from request to find subtitles even if type mismatch (e.g. anime vs series)
    // We rely on IMDB ID being unique enough.

    const subtitles = await findSubtitles({
      imdb_id,
      season,
      episode
      // type: type // Removed to allow fuzzy matching
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
    res.json({ subtitles: [] });
  }
};

module.exports = { getSubtitles };
