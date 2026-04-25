
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
  'mal': 'മലയാളം',
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

  // Stremio only sends 'movie' or 'series' — 'anime' is not valid.
  // Normalize so a DB query for 'series' also matches records stored as 'anime'.
  const normaliseType = (t) => (t === 'anime' ? 'series' : t);
  const dbTypes = type === 'series'
    ? ['series', 'anime']   // series request: match both series + anime rows
    : [normaliseType(type)];

  // Check cache
  const cacheKey = `${type}:${idClean}`;
  const cached = cache[cacheKey];
  if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
    console.log(`[Stremio Request] Serving from cache for ${cacheKey}`);
    res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    return res.json(cached.data);
  }

  try {
    console.log(`[Stremio Request] Querying database for types: [${dbTypes.join(', ')}]...`);

    // Fetch for each matching DB type and merge results
    const allResults = await Promise.all(
      dbTypes.map(dbType => findSubtitles({ imdb_id, season, episode, type: dbType }))
    );
    const subtitles = allResults.flat();

    console.log(`[Stremio Request] DB returned ${subtitles.length} raw records:`);
    subtitles.forEach((s, i) => console.log(`  [${i}]`, JSON.stringify(s)));

    if (subtitles.length === 0) {
      console.log(`[Stremio Request] No subtitles found for imdb_id=${imdb_id} season=${season} episode=${episode}`);
    }

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
        
        // Short, clean Proxy URL using UUID
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const proxyUrl = `${protocol}://${host}/subtitles/download/${sub.id}.vtt`;

        // Stremio requires: id (string), url (string), lang (ISO 639-2 string)
        return {
          id: String(sub.id),
          url: proxyUrl, 
          lang: langCode,
          title: title
        };
      });

    const response = { subtitles: mapped };

    // Update cache
    cache[cacheKey] = { timestamp: Date.now(), data: response };

    console.log(`[Stremio Request] Sending ${mapped.length} subtitles to Stremio:`);
    console.log(JSON.stringify(response, null, 2));
    
    // Stremio strictly recommends setting Cache-Control logic for subtitle responses
    // During debugging, we set it to 0 to prevent Stremio from caching bad states.
    res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    res.json(response);

  } catch (err) {
    console.error(`[Stremio Request] Error fetching subtitles for ${idClean}:`, err);
    res.status(500).json({ subtitles: [] });
  }
};

module.exports = { getSubtitles };
