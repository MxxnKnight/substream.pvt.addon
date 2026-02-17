import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import { getSupabaseAdminClient } from './supabase.js';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_SUBTITLE_SIZE_BYTES || 5 * 1024 * 1024)
  }
});

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map((v) => v.trim()).filter(Boolean) || ['*'];
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN;
const STORAGE_BUCKET = process.env.SUPABASE_SUBTITLE_BUCKET || 'subtitles';

app.use(cors({ origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS }));
app.use(express.json());

function normalizeContentType(type) {
  if (type === 'movie') {
    return 'movie';
  }

  // anime is treated as a series internally
  if (type === 'anime') {
    return 'series';
  }

  return 'series';
}

function parseTypeId(type, rawId) {
  if (!type || !rawId) {
    return { contentType: null, imdbId: null, season: null, episode: null };
  }

  const contentType = normalizeContentType(type);
  const parts = String(rawId).split(':');
  const imdbId = parts[0] || null;

  let season = null;
  let episode = null;

  if (contentType === 'series') {
    // Stremio style: tt1234567:1:2
    if (parts.length >= 3) {
      season = Number(parts[1]);
      episode = Number(parts[2]);
    }
  }

  return { contentType, imdbId, season, episode };
}

function authUpload(req, res, next) {
  if (!UPLOAD_TOKEN) {
    return res.status(503).json({ error: 'Upload endpoint disabled (UPLOAD_TOKEN not set)' });
  }

  const received = req.header('x-upload-token');
  if (!received || received !== UPLOAD_TOKEN) {
    return res.status(401).json({ error: 'Invalid upload token' });
  }

  return next();
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.get('/manifest.json', (_req, res) => {
  res.json({
    id: 'community.substream.pvt.addon',
    version: '0.2.0',
    name: 'Substream Pvt',
    description: 'Community subtitles for movies and series',
    resources: ['subtitles'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: [],
    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  });
});

app.get('/subtitles/:type/:id.json', async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { type, id } = req.params;
    const { contentType, imdbId, season, episode } = parseTypeId(type, id);

    if (!contentType || !imdbId) {
      return res.status(400).json({ error: 'Invalid type/id' });
    }

    const lang = req.query.lang ? String(req.query.lang).toLowerCase() : null;

    let query = supabase
      .from('subtitles')
      .select('id, language, hearing_impaired, file_path, release_name')
      .eq('content_type', contentType)
      .eq('imdb_id', imdbId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (contentType === 'series' && Number.isFinite(season) && Number.isFinite(episode)) {
      query = query.eq('season', season).eq('episode', episode);
    }

    if (lang) {
      query = query.eq('language', lang);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const signedRows = await Promise.all((data || []).map(async (row) => {
      const { data: signed, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(row.file_path, 60 * 30);

      if (signError || !signed?.signedUrl) {
        return null;
      }

      return {
        id: row.id,
        lang: row.language,
        url: signed.signedUrl,
        hearingImpaired: row.hearing_impaired,
        ...(row.release_name ? { releaseInfo: row.release_name } : {})
      };
    }));

    const subtitles = signedRows.filter(Boolean);
    return res.json({ subtitles });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch subtitles' });
  }
});

app.post('/upload/subtitle', authUpload, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file field' });
    }

    const allowed = new Set(['.srt', '.ass', '.vtt', '.sub']);
    const originalName = req.file.originalname || 'subtitle.srt';
    const dotIndex = originalName.lastIndexOf('.');
    const ext = dotIndex >= 0 ? originalName.slice(dotIndex).toLowerCase() : '';

    if (!allowed.has(ext)) {
      return res.status(400).json({ error: 'Unsupported file type. Use .srt, .ass, .vtt, or .sub' });
    }

    const {
      contentType,
      imdbId,
      tmdbId,
      season,
      episode,
      language,
      hearingImpaired,
      releaseName,
      uploaderId
    } = req.body;

    if (!contentType || !imdbId || !language) {
      return res.status(400).json({ error: 'contentType, imdbId and language are required' });
    }

    const normalizedType = normalizeContentType(contentType);
    if (normalizedType === 'series' && (!season || !episode)) {
      return res.status(400).json({ error: 'season and episode are required for series/anime subtitles' });
    }

    const supabase = getSupabaseAdminClient();
    const objectName = `${normalizedType}/${imdbId}/${crypto.randomUUID()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectName, req.file.buffer, {
        contentType: req.file.mimetype || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const payload = {
      content_type: normalizedType,
      imdb_id: imdbId,
      tmdb_id: tmdbId || null,
      season: normalizedType === 'series' ? Number(season) : null,
      episode: normalizedType === 'series' ? Number(episode) : null,
      language: String(language).toLowerCase(),
      hearing_impaired: String(hearingImpaired || 'false') === 'true',
      release_name: releaseName || originalName,
      uploader_id: uploaderId || null,
      file_path: objectName,
      status: 'approved'
    };

    const { data, error: insertError } = await supabase
      .from('subtitles')
      .insert(payload)
      .select('id, file_path, content_type, imdb_id, season, episode, language, release_name, created_at')
      .single();

    if (insertError) {
      throw insertError;
    }

    return res.status(201).json({ subtitle: data });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to upload subtitle' });
  }
});

app.get('/admin/subtitles', authUpload, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';

    const { data, error } = await supabase
      .from('subtitles')
      .select('id, imdb_id, content_type, season, episode, language, release_name, file_path, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    let rows = data || [];
    if (search) {
      rows = rows.filter((row) => {
        const joined = [
          row.imdb_id,
          row.content_type,
          row.language,
          row.release_name,
          row.file_path
        ].filter(Boolean).join(' ').toLowerCase();
        return joined.includes(search);
      });
    }

    return res.json({ subtitles: rows });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to list subtitles' });
  }
});

app.delete('/admin/subtitles/:id', authUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdminClient();

    const { data: row, error: fetchError } = await supabase
      .from('subtitles')
      .select('id, file_path')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return res.status(404).json({ error: 'Subtitle not found' });
    }

    const { error: removeFileError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([row.file_path]);

    if (removeFileError) {
      throw removeFileError;
    }

    const { error: deleteError } = await supabase
      .from('subtitles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return res.json({ ok: true, id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete subtitle' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`substream server listening on :${PORT}`);
});
