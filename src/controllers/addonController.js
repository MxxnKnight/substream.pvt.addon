
const { findSubtitles } = require('../services/db');

// Simple in-memory cache
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ISO 639-2 codes for supported languages.
// English = 'eng', Malayalam = 'mal'
// Reference: https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
const LANG_MAP = {
  // English variants
  'en': 'eng',
  'eng': 'eng',
  'english': 'eng',
  // Malayalam variants
  'ml': 'mal',
  'mal': 'mal',
  'malayalam': 'mal',
};

const LANG_NAMES = {
  'eng': 'English',
  'mal': 'Malayalam',
};


const getSubtitles = async (req, res) => {
  const { type, id } = req.params;
  console.log(`\n[Stremio Request] Incoming subtitle request: type=${type}, id=${id}`);

  // Strip .json extension if present (belt-and-suspenders: route already handles :id.json)
  const idClean = id.replace(/\.json$/i, '');

  // Stremio ID format:
  // Movie: tt1234567
  // Series: tt1234567:1:1 (imdb_id:season:episode)
  const parts = idClean.split(':');
  const imdb_id = parts[0];

  const s = parseInt(parts[1], 10);
  const season = !isNaN(s) ? s : null;

  const e = parseInt(parts[2], 10);
  const episode = !isNaN(e) ? e : null;
  console.log(`[Stremio Request] Parsed: imdb_id=${imdb_id}, season=${season}, episode=${episode}`);

  // Check cache
  const cacheKey = `${type}:${idClean}`;
  const cached = cache[cacheKey];
  if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
    console.log(`[Stremio Request] Serving from cache for ${cacheKey}`);
    return res.json(cached.data);
  }

  try {
    console.log(`[Stremio Request] Querying database...`);

    const subtitles = await findSubtitles({
      imdb_id,
      season,
      episode
    });

    console.log(`[Stremio Request] DB returned ${subtitles.length} raw records:`);
    subtitles.forEach((s, i) => console.log(`  [${i}]`, JSON.stringify(s)));

    const mapped = subtitles
      .filter(sub => !!sub.file_path) // must have a URL
      .map(sub => {
        const langKey = sub.language?.toLowerCase().trim();
        const langCode = LANG_MAP[langKey] || langKey || 'eng';
        const langName = LANG_NAMES[langCode] || langCode;

        // Extract filename from URL for display title
        let fileName = 'Subtitle';
        try {
          const urlParts = new URL(sub.file_path);
          const pathParts = urlParts.pathname.split('/');
          const rawName = pathParts[pathParts.length - 1];
          fileName = decodeURIComponent(rawName);
        } catch (_) {
          const pathParts = sub.file_path.split('/');
          fileName = pathParts[pathParts.length - 1];
        }

        const title = `${langName} - ${fileName}`;

        // Stremio requires: id (string), url (string), lang (ISO 639-2 string)
        return {
          id: String(sub.id),       // MUST be a string
          url: sub.file_path,       // MUST be a publicly accessible direct URL
          lang: langCode,           // MUST be ISO 639-2 (3-letter) code
          title: title              // optional but helpful for UX
        };
      });

    const response = { subtitles: mapped };

    // Update cache
    cache[cacheKey] = { timestamp: Date.now(), data: response };

    console.log(`[Stremio Request] Sending ${mapped.length} subtitles to Stremio:`);
    console.log(JSON.stringify(response, null, 2));
    res.json(response);

  } catch (err) {
    console.error(`[Stremio Request] Error fetching subtitles for ${idClean}:`, err);
    res.status(500).json({ subtitles: [] });
  }
};

module.exports = { getSubtitles };
