
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { parseFilename } = require('../utils/filenameParser');
const { insertSubtitle } = require('../services/db');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const uploadSubtitle = async (req, res) => {
  try {
    const { imdb_id, type, language } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!imdb_id || !type || !language) {
      // Cleanup file if metadata missing
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Missing metadata (imdb_id, type, language)' });
    }

    const results = [];
    const ext = path.extname(file.originalname).toLowerCase();

    // Helper to process a single subtitle content (from buffer or file)
    const processSubtitle = async (originalName, sourcePath, buffer = null) => {
      const parsed = parseFilename(originalName);
      if (!parsed) {
        console.warn(`Could not parse filename: ${originalName}`);
        return null;
      }
      const { season, episode } = parsed;

      // Ensure directory exists: uploads/{imdb_id}/
      const targetDir = path.join('uploads', imdb_id);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Generate target filename
      // Format: SxxExx.srt
      const newFilename = `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}.srt`;
      const targetPath = path.join(targetDir, newFilename);

      // Write file
      if (buffer) {
        fs.writeFileSync(targetPath, buffer);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }

      // Construct public URL
      const publicUrl = `${BASE_URL}/uploads/${imdb_id}/${newFilename}`;

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
        if (entry.isDirectory || path.extname(entry.name).toLowerCase() !== '.srt') {
          continue;
        }

        // entry.getData() returns buffer
        const result = await processSubtitle(entry.name, null, entry.getData());
        if (result) results.push(result);
      }
    } else if (ext === '.srt') {
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
    // Cleanup if file exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { uploadSubtitle };
