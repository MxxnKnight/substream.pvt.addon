
const { findSubtitles } = require('../services/db');

// Simple in-memory cache
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getSubtitles = async (req, res) => {
  const { type, id } = req.params;
  console.log(`\n[Stremio Request] Incoming subtitle request: type=${type}, id=${id}`);

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
  console.log(`[Stremio Request] Parsed parameters: imdb_id=${imdb_id}, season=${season}, episode=${episode}`);

  // Check cache
  const cacheKey = `${type}:${idClean}`;
  const cached = cache[cacheKey];
  if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
    console.log(`[Stremio Request] Serving from cache for ${cacheKey}`);
    console.log(`[Stremio Request] Response payload:`, JSON.stringify(cached.data, null, 2));
    return res.json(cached.data);
  }

  try {
    // Query database
    // Note: We ignore 'type' parameter from request to find subtitles even if type mismatch (e.g. anime vs series)
    // We rely on IMDB ID being unique enough.
    console.log(`[Stremio Request] Querying database for subtitles...`);

    const subtitles = await findSubtitles({
      imdb_id,
      season,
      episode
      // type: type // Removed to allow fuzzy matching
    });
    console.log(`[Stremio Request] Database returned ${subtitles.length} results.`);

    const response = {
      subtitles: subtitles.map(sub => {
        // Map common 2-letter codes or mistyped codes to ISO 639-2
        const langMap = {
          'ml': 'mal',
          'en': 'eng',
          'english': 'eng',
          'malayalam': 'mal'
        };
        const langCode = langMap[sub.language?.toLowerCase()] || sub.language || 'eng';

        // Extract filename for the title
        let fileName = 'Subtitle';
        if (sub.file_path) {
          const parts = sub.file_path.split('/');
          fileName = parts[parts.length - 1];
        }

        // Build a readable title, e.g. "Malayalam - filename.srt"
        const langName = langCode === 'mal' ? 'Malayalam' : (langCode === 'eng' ? 'English' : langCode);
        const title = `${langName} - ${fileName}`;

        return {
          id: sub.id,
          lang: langCode,
          title: title,
          type: 'external',
          url: sub.file_path
        };
      })
    };

    // Update cache
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: response
    };

    console.log(`[Stremio Request] Sending response payload to Stremio:`, JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error(`[Stremio Request] Error fetching subtitles for ${idClean}:`, err);
    res.json({ subtitles: [] });
  }
};

module.exports = { getSubtitles };
