const { supabase } = require('../services/db');
const { getMetadata } = require('../services/tmdb');
const fetch = require('node-fetch');

// Simple cache for TMDB results to avoid hitting rate limits or slow responses
const metadataCache = new Map();

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
    console.log(`[External Search] Found ${allResults.length} results total`);
    res.json(allResults);
  } catch (err) {
    console.error('[External Search] Error:', err);
    res.status(500).json({ error: 'Failed to search external sites' });
  }
};



const inspectExternalLink = async (req, res) => {
  const { link, title } = req.query;
  if (!link) return res.status(400).json({ error: 'Link is required' });
  try {
    const metadata = await scraper.getMetadataFromPage(link);
    
    // VERIFY WITH TMDB if we found an ID
    if (metadata.imdbId) {
      const tmdb = await getMetadata(metadata.imdbId);
      if (tmdb && tmdb.type) {
        metadata.type = tmdb.type;
        metadata.tmdbTitle = tmdb.title; // Extra info for UI
      }
    } else if (title) {
       // Fallback: If no IMDb found on page, search TMDB by title
       // Clean title from common MalayalamSubtitles.in additions (like "- Malayalam", "(2023)", etc)
       let cleanTitle = title.replace(/–|मलयालम|മലയാളം|പരിഭാഷ|Malayalam Subtitle|Malayalam/gi, '').trim();
       cleanTitle = cleanTitle.replace(/\s*\([^)]*\)\s*/g, ' ').trim(); // Remove year in parenthesis (2023)
       
       console.log(`[Inspect] Searching TMDB by title fallback: ${cleanTitle}`);
       if (process.env.TMDB_API_KEY) {
          // Search TMDB for movie
          const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`);
          if (searchRes.ok) {
             const data = await searchRes.json();
             const result = data.results?.[0];
             if (result) {
                // If we found a result by title, let's get its external IDs to get IMDB ID
                const type = result.media_type === 'tv' ? 'tv' : 'movie';
                const idRes = await fetch(`https://api.themoviedb.org/3/${type}/${result.id}/external_ids?api_key=${process.env.TMDB_API_KEY}`);
                if (idRes.ok) {
                   const idData = await idRes.json();
                   if (idData.imdb_id) {
                      metadata.imdbId = idData.imdb_id;
                      metadata.type = type === 'tv' ? 'series' : 'movie';
                      metadata.tmdbTitle = result.title || result.name;
                   }
                }
             }
          }
       }
    }
    
    res.json(metadata);
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect link' });
  }
};

const importExternalSubtitle = async (req, res) => {
  let { link, title, source, imdb_id, type, season, episode } = req.body;

  if (!link || !source) {
    return res.status(400).json({ error: 'Missing required fields (link, source)' });
  }

  console.log(`[Import] Attempting to import from ${source}: ${link}`);

  try {
    // 1. Auto-detect metadata if missing
    if (!imdb_id || !type) {
      console.log('[Import] Missing metadata, detecting from page...');
      const detected = await scraper.getMetadataFromPage(link);
      if (!imdb_id) imdb_id = detected.imdbId;
      if (!type) type = detected.type;
      
      // Fallback search by title if scraping failed
      if (!imdb_id && title && process.env.TMDB_API_KEY) {
         let cleanTitle = title.replace(/–|मलयालम|മലയാളം|പരിഭാഷ|Malayalam Subtitle|Malayalam/gi, '').trim();
         cleanTitle = cleanTitle.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
         console.log(`[Import] Searching TMDB by title fallback: ${cleanTitle}`);
         const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`);
         if (searchRes.ok) {
            const data = await searchRes.json();
            const result = data.results?.[0];
            if (result) {
               type = result.media_type === 'tv' ? 'series' : 'movie';
               const typeParam = result.media_type === 'tv' ? 'tv' : 'movie';
               const idRes = await fetch(`https://api.themoviedb.org/3/${typeParam}/${result.id}/external_ids?api_key=${process.env.TMDB_API_KEY}`);
               if (idRes.ok) {
                  const idData = await idRes.json();
                  if (idData.imdb_id) imdb_id = idData.imdb_id;
               }
            }
         }
      }
    }

    if (!imdb_id) {
      throw new Error('IMDb ID could not be detected. Please enter it manually.');
    }

    // 2. Double check type with TMDB for 100% accuracy
    const tmdbData = await getMetadata(imdb_id);
    if (tmdbData && tmdbData.type) {
      type = tmdbData.type;
    }

    // 3. Get the direct download link
    const downloadUrl = await scraper.getDirectDownloadLink(link, source);
    if (!downloadUrl) throw new Error(`Could not find a download link on the page: ${link}`);

    // 4. Download the file
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Failed to download subtitle from upstream: ${response.statusText}`);

    let buffer = await response.arrayBuffer();
    buffer = Buffer.from(buffer);

    const isZip = downloadUrl.toLowerCase().endsWith('.zip') || response.headers.get('content-type')?.includes('zip');
    
    // List to hold files to upload
    let filesToProcess = [];

    if (isZip) {
      console.log('[Import] ZIP detected, extracting all files...');
      const extractedFiles = scraper.extractAllSrtsFromBuffer(buffer);
      if (extractedFiles.length === 0) throw new Error('No .srt or .vtt files found in ZIP');
      filesToProcess = extractedFiles;
    } else {
      let fileName = downloadUrl.split('/').pop() || 'subtitle.srt';
      if (!fileName.toLowerCase().endsWith('.srt') && !fileName.toLowerCase().endsWith('.vtt')) fileName += '.srt';
      filesToProcess = [{ name: fileName, data: buffer }];
    }

    const results = [];

    // 5. Process each file
    for (const file of filesToProcess) {
      let fSeason = season;
      let fEpisode = episode;

      // Auto-detect S/E if it's a series and we don't have manual info
      if (type === 'series') {
        const detected = scraper.detectSeasonEpisode(file.name);
        if (detected.season !== null && !fSeason) fSeason = detected.season;
        if (detected.episode !== null && !fEpisode) fEpisode = detected.episode;
      }

      // Upload to Supabase Storage
      const storagePath = `${imdb_id}/${uuidv4()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('subtitles')
        .upload(storagePath, file.data, {
          contentType: 'application/x-subrip',
          upsert: false
        });

      if (uploadError) {
        console.error(`[Import] Upload failed for ${file.name}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('subtitles')
        .getPublicUrl(storagePath);

      // Save to DB
      const { data: dbRecord, error: dbError } = await supabase
        .from('subtitles')
        .insert([{
          imdb_id,
          type,
          season: type === 'series' ? (parseInt(fSeason, 10) || null) : null,
          episode: type === 'series' ? (parseInt(fEpisode, 10) || null) : null,
          language: 'Malayalam',
          file_path: publicUrl
        }])
        .select()
        .single();

      if (dbError) {
        console.error(`[Import] DB insert failed for ${file.name}:`, dbError);
      } else {
        results.push(dbRecord);
      }
    }

    if (results.length === 0) throw new Error('Failed to import any subtitles from the file(s)');

    console.log(`[Import] Successfully imported ${results.length} files for ${imdb_id}`);
    res.json({ message: `Successfully imported ${results.length} subtitle(s)`, data: results });

  } catch (err) {
    console.error('[Import] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to import subtitle' });
  }
};

module.exports = { 
  listSubtitles, 
  deleteSubtitle, 
  fetchMetadata, 
  searchExternalSubtitles, 
  importExternalSubtitle,
  inspectExternalLink
};
