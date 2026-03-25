
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { parseFilename } = require('../utils/filenameParser');
const { insertSubtitle, supabase } = require('../services/db');
require('dotenv').config();

const uploadSubtitle = async (req, res) => {
  try {
    const { imdb_id, type, language } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!imdb_id || !type || !language) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Missing metadata (imdb_id, type, language)' });
    }

    const results = [];
    const ext = path.extname(file.originalname).toLowerCase();

    // Helper to process a single subtitle content (from buffer or file)
    const processSubtitle = async (originalName, sourcePath, buffer = null) => {
      let season = null;
      let episode = null;

      // Try to parse season/episode for series/anime
      if (type !== 'movie') {
        const parsed = parseFilename(originalName);
        if (parsed) {
          season = parsed.season;
          episode = parsed.episode;
        } else {
          console.warn(`Could not parse season/episode from: ${originalName} (type: ${type})`);
          return null;
        }
      }

      // Generate target filename
      let newFilename;
      const fileExt = path.extname(originalName).toLowerCase();
      if (type === 'movie') {
        const sanitized = originalName.replace(/[^a-z0-9.]/gi, '_');
        newFilename = `${Date.now()}_${sanitized}`;
      } else {
        newFilename = `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}${fileExt}`;
      }

      const storagePath = `${imdb_id}/${newFilename}`;
      console.log(`Saving subtitle to Supabase Storage: ${storagePath}`);

      let fileBuffer = buffer;
      if (!fileBuffer) {
        fileBuffer = fs.readFileSync(sourcePath);
      }

      const { data, error } = await supabase
        .storage
        .from('subtitles')
        .upload(storagePath, fileBuffer, {
          contentType: 'text/plain',
          upsert: true
        });

      if (error) {
        console.error(`Error uploading to Supabase Storage ${storagePath}:`, error);
        throw error;
      }

      // Construct public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('subtitles')
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      // Insert into DB
      try {
        const record = await insertSubtitle({
          imdb_id,
          type,
          season,
          episode,
          language,
          file_path: publicUrl
        });
        return record;
      } catch (err) {
        console.error(`Error inserting subtitle ${originalName}:`, err);
        return null;
      }
    };

    if (ext === '.zip') {
      const zip = new AdmZip(file.path);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        const entryExt = path.extname(entry.name).toLowerCase();
        if (entry.isDirectory || (entryExt !== '.srt' && entryExt !== '.vtt')) {
          continue;
        }
        const result = await processSubtitle(entry.name, null, entry.getData());
        if (result) results.push(result);
      }
    } else if (ext === '.srt' || ext === '.vtt') {
      const result = await processSubtitle(file.originalname, file.path);
      if (result) results.push(result);
    }

    // Cleanup uploaded temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.json({ message: 'Upload processed', count: results.length, results });

  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { uploadSubtitle };
