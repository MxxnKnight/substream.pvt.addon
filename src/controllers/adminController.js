
const { supabase } = require('../services/db');
const { getMetadata } = require('../services/tmdb');

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

module.exports = { listSubtitles, deleteSubtitle, fetchMetadata };
