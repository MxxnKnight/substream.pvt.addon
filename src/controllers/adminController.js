const { supabase } = require('../services/db');
const { getMetadata, searchByTitle } = require('../services/tmdb');
const fetch = require('node-fetch');

// Simple cache for TMDB results to avoid hitting rate limits or slow responses
const metadataCache = new Map();

// Session cache for external ZIP imports (Review & Edit workflow)
// Stores: sessionId -> { buffer, files: [{name, data}], expires }
const importSessions = new Map();

// Cleanup expired sessions every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of importSessions.entries()) {
    if (now > session.expires) {
      console.log(`[Import Session] Expired and cleared: ${id}`);
      importSessions.delete(id);
    }
  }
}, 60000);

// Retry helper for transient Supabase network errors (ECONNRESET / fetch failed from localhost)
const retrySupabase = async (fn, maxRetries = 3, delayMs = 600) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isNetworkErr =
        err?.message?.includes('fetch failed') ||
        err?.message?.includes('ECONNRESET');
      if (isNetworkErr && attempt < maxRetries) {
        console.warn(`[Supabase] Network error (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};

const listSubtitles = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subtitles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Enhance records with TMDB metadata
    const enhancedData = await Promise.all(data.map(async (sub) => {
      const imdbId = sub.imdb_id;
      if (!metadataCache.has(imdbId)) {
        const metadata = await getMetadata(imdbId);
        metadataCache.set(imdbId, metadata);
      }
      return {
        ...sub,
        metadata: metadataCache.get(imdbId)
      };
    }));

    res.json(enhancedData);
  } catch (err) {
    console.error('[List] Error:', err);
    res.status(500).json({ error: 'Failed to fetch subtitles' });
  }
};

const fetchMetadata = async (req, res) => {
  const { imdbId } = req.query;
  if (!imdbId) return res.status(400).json({ error: 'imdbId is required' });

  try {
    if (!metadataCache.has(imdbId)) {
      const metadata = await getMetadata(imdbId);
      metadataCache.set(imdbId, metadata);
    }
    res.json(metadataCache.get(imdbId) || { error: 'No metadata found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
};

const deleteSubtitle = async (req, res) => {
  const { id } = req.params;
  console.log(`[Delete] Request to delete subtitle id=${id}`);

  try {
    // 1. Fetch the record first to get file_path for storage deletion (with retry)
    const { data: subtitle, error: fetchError } = await retrySupabase(() =>
      supabase
        .from('subtitles')
        .select('*')
        .eq('id', id)
        .single()
    );

    if (fetchError) {
      // PGRST116 = row not found
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Subtitle not found' });
      }
      console.error('[Delete] Error fetching subtitle:', fetchError);
      return res.status(500).json({ error: 'Database error while fetching subtitle' });
    }

    // 2. Delete from DB (with retry)
    const { error: deleteError } = await retrySupabase(() =>
      supabase
        .from('subtitles')
        .delete()
        .eq('id', id)
    );

    if (deleteError) {
      console.error('[Delete] DB delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete from database' });
    }

    console.log(`[Delete] DB record deleted for id=${id}`);

    // 3. Delete from Supabase storage — best-effort, don't fail if this errors
    if (subtitle?.file_path) {
      try {
        const urlObj = new URL(subtitle.file_path);
        const pathSegments = urlObj.pathname.split('/');
        // URL: /storage/v1/object/public/{bucket}/{storagePath...}
        // e.g. /storage/v1/object/public/subtitles/tt1234567/S01E01.srt
        const publicIndex = pathSegments.indexOf('public');
        if (publicIndex !== -1 && publicIndex + 2 < pathSegments.length) {
          const storagePath = decodeURIComponent(pathSegments.slice(publicIndex + 2).join('/'));
          console.log(`[Delete] Removing from storage: ${storagePath}`);
          const { error: storageError } = await supabase
            .storage
            .from('subtitles')
            .remove([storagePath]);

          if (storageError) {
            console.error(`[Delete] Storage removal failed (non-critical): ${storagePath}`, storageError);
          } else {
            console.log(`[Delete] Storage file removed: ${storagePath}`);
          }
        } else {
          console.warn('[Delete] Could not extract storage path from URL:', subtitle.file_path);
        }
      } catch (err) {
        console.error('[Delete] Error during storage removal (non-critical):', err.message);
      }
    }

    res.json({ message: 'Subtitle deleted successfully' });

  } catch (err) {
    console.error('[Delete] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error during deletion' });
  }
};


const scraper = require('../services/scraper');
const { v4: uuidv4 } = require('uuid');

const searchExternalSubtitles = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  console.log(`[External Search] Searching for: "${query}"`);

  try {
    const [results1, results2, results3] = await Promise.all([
      scraper.searchMSone(query),
      scraper.searchMalayalamSubtitlesIn(query),
      scraper.searchMovieMirror(query)
    ]);

    const allResults = [...results1, ...results2, ...results3];
    
    // Proactive TMDB Matching for Top Results
    const enrichedResults = await Promise.all(allResults.map(async (res) => {
        try {
            // Clean title for matching
            let clean = res.title.replace(/–|മലയാളം|പരിഭാഷ|Malayalam Subtitle|Malayalam/gi, '').trim();
            clean = clean.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
            const tmdb = await searchByTitle(clean);
            if (tmdb) {
                return { ...res, imdb_id: tmdb.imdbId, type: tmdb.type, poster: tmdb.poster_path, tmdbTitle: tmdb.title };
            }
        } catch (e) { /* ignore */ }
        return res;
    }));

    console.log(`[External Search] Found ${enrichedResults.length} total results`);
    res.json(enrichedResults);
  } catch (err) {
    console.error('[External Search] Error:', err);
    res.status(500).json({ error: 'Failed to search external sites' });
  }
};

const searchTmdbByTitle = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  const result = await searchByTitle(query);
  if (result) res.json(result);
  else res.status(404).json({ error: 'Not found' });
};



const inspectExternalLink = async (req, res) => {
  const { link, title, source } = req.query;
  if (!link || !source) return res.status(400).json({ error: 'Link and source are required' });
  
  try {
    // Use the improved metadata scraper (Second Hop)
    const metadata = await scraper.getMetadataFromPage(link);
    
    // Enrich with TMDB if possible
    if (metadata.imdbId) {
      const tmdb = await getMetadata(metadata.imdbId);
      if (tmdb && tmdb.type) {
        metadata.type = tmdb.type;
        metadata.tmdbTitle = tmdb.title;
        // Don't overwrite the specifically scraped poster if TMDB doesn't have a better one
        if (!metadata.poster) metadata.poster = tmdb.poster_path;
      }
    } else if (title) {
       let cleanTitle = title.replace(/–|മലയാളം|പരിഭാഷ|Malayalam Subtitle|Malayalam/gi, '').trim();
       cleanTitle = cleanTitle.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
       const tmdbFallback = await searchByTitle(cleanTitle);
       if (tmdbFallback) {
         metadata.imdbId = tmdbFallback.imdbId;
         metadata.type = tmdbFallback.type;
         metadata.tmdbTitle = tmdbFallback.title;
         if (!metadata.poster) metadata.poster = tmdbFallback.poster_path;
       }
    }

    let downloadUrl = await scraper.getDirectDownloadLink(link, source);
    if (!downloadUrl) throw new Error('Download link extraction failed');

    let response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('Upstream download failed');

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        // We hit a redirect page (common on Movie Mirror), try to scrape it for the ACTUAL zip
        const html = await response.text();
        const $ = require('cheerio').load(html);
        const deeperLink = $('a[href$=".zip"]').attr('href') || $('a:contains("Download")').attr('href') || $('a[href*="drive.google"]').attr('href');
        
        if (deeperLink) {
             let finalLink = deeperLink.startsWith('http') ? deeperLink : new URL(deeperLink, downloadUrl).href;
             
             // Convert Google Drive view links to direct download links
             if (finalLink.includes('drive.google.com/file/d/')) {
                 const match = finalLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
                 if (match) {
                     finalLink = `https://drive.google.com/uc?export=download&id=${match[1]}`;
                 }
             }

             console.log(`[Inspect] Followed HTML redirect to deeper link: ${finalLink}`);
             response = await fetch(finalLink);
             
             // One last check if the new link is a Google Drive link that redirected us back to an HTML page
             // (Some large Google Drive files show a virus scan warning HTML page)
             const newContentType = response.headers.get('content-type') || '';
             if (newContentType.includes('text/html') && finalLink.includes('drive.google')) {
                 const warningHtml = await response.text();
                 const warningMatch = warningHtml.match(/uc\?export=download&amp;confirm=[^"']+/);
                 if (warningMatch) {
                     const warningLink = `https://drive.google.com/${warningMatch[0].replace(/&amp;/g, '&')}`;
                     console.log(`[Inspect] Bypassing Google Drive virus warning...`);
                     response = await fetch(warningLink);
                 }
             }

             if (!response.ok) throw new Error('Deeper upstream download failed');
        } else {
             console.error(`[Inspect] No deeper link found in HTML response. HTML head: ${html.substring(0, 500)}`);
             throw new Error('Hit an authorization or captcha page instead of a download link.');
        }
    }

    let buffer = await response.arrayBuffer();
    buffer = Buffer.from(buffer);

    const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
    let files = [];

    if (isZip) {
      files = scraper.extractAllSrtsFromBuffer(buffer);
    } else {
      let fileName = title ? title.replace(/[^a-z0-9._-]/gi, '_') : downloadUrl.split('/').pop() || 'subtitle';
      fileName = fileName.replace(/_+/g, '_').replace(/^_|_$/g, '');
      if (!fileName.toLowerCase().endsWith('.srt') && !fileName.toLowerCase().endsWith('.vtt')) fileName += '.srt';
      files = [{ name: fileName, data: buffer }];
    }

    const sessionId = uuidv4();
    importSessions.set(sessionId, {
      files: files,
      expires: Date.now() + 10 * 60 * 1000
    });

    res.json({
      ...metadata,
      sessionId,
      files: files.map(f => {
        const detection = scraper.detectSeasonEpisode(f.name);
        return {
          name: f.name,
          season: detection.season,
          episode: detection.episode
        };
      })
    });

  } catch (err) {
    console.error('[Inspect] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to inspect link' });
  }
};

const importExternalSubtitle = async (req, res) => {
  const { sessionId, imdb_id, type, files: userFiles } = req.body;

  if (!sessionId || !imdb_id || !userFiles) {
    return res.status(400).json({ error: 'Missing required session or metadata' });
  }

  const session = importSessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session expired or not found' });

  console.log(`[Import] Processing session ${sessionId} for ${imdb_id} (${type})`);

  try {
    const results = [];

    for (const uFile of userFiles) {
      // Find original data from session
      const original = session.files.find(f => f.name === uFile.originalName);
      if (!original) continue;

      const finalName = uFile.newName || uFile.originalName;
      const season = uFile.season;
      const episode = uFile.episode;

      // DUPLICATE LOGIC: Series (Overwrite + Delete)
      if (type === 'series' && season && episode) {
        const { data: existing } = await supabase
          .from('subtitles')
          .select('*')
          .eq('imdb_id', imdb_id)
          .eq('season', season)
          .eq('episode', episode);

        if (existing && existing.length > 0) {
          for (const old of existing) {
            console.log(`[Import] Overwriting existing S${season}E${episode}. Deleting old file...`);
            // 1. Delete from storage if link follows our pattern
            try {
              const urlParts = old.file_path.split('/');
              const storagePath = decodeURIComponent(urlParts.slice(urlParts.indexOf('public') + 2).join('/'));
              await supabase.storage.from('subtitles').remove([storagePath]);
            } catch (e) { console.error('[Import] Storage cleanup failed:', e); }

            // 2. Delete from DB
            await supabase.from('subtitles').delete().eq('id', old.id);
          }
        }
      }

      // UPLOAD NEW FILE
      // preserve original sequence exactly in filename
      const storagePath = `${imdb_id}/${uuidv4()}_${finalName}`;
      const mimeType = finalName.toLowerCase().endsWith('.vtt') ? 'text/vtt' : 'text/plain';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('subtitles')
        .upload(storagePath, original.data, { contentType: mimeType, upsert: false });

      if (uploadError) {
        console.error(`[Import] Upload failed for ${finalName}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from('subtitles').getPublicUrl(storagePath);

      // SAVE TO DB
      const { data: dbRecord, error: dbError } = await supabase
        .from('subtitles')
        .insert([{
          imdb_id,
          type,
          season: type === 'series' ? (parseInt(season, 10) || null) : null,
          episode: type === 'series' ? (parseInt(episode, 10) || null) : null,
          language: 'Malayalam',
          file_path: publicUrl
        }])
        .select()
        .single();

      if (dbError) console.error(`[Import] DB insert failed for ${finalName}:`, dbError);
      else results.push(dbRecord);
    }

    // Cleanup session
    importSessions.delete(sessionId);

    res.json({ message: `Successfully imported ${results.length} subtitle(s)`, data: results });

  } catch (err) {
    console.error('[Import] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to import' });
  }
};

module.exports = { 
  listSubtitles, 
  deleteSubtitle, 
  fetchMetadata, 
  searchExternalSubtitles, 
  importExternalSubtitle,
  inspectExternalLink,
  searchTmdbByTitle
};
