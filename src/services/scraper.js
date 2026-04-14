
const cheerio = require('cheerio');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Dynamically import fetch for Node versions where it's not global
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Normalizes movie name for search
 */
const normalize = (q) => encodeURIComponent(q.trim());

/**
 * SCRAPER 1: malayalamsubtitles.in
 */
const searchMalayalamSubtitlesIn = async (query) => {
  try {
    const searchUrl = `https://malayalamsubtitles.in/?s=${normalize(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('.elementor-post').each((i, el) => {
      const title = $(el).find('.elementor-post__title a').text().trim();
      const link = $(el).find('.elementor-post__title a').attr('href');
      const thumbnail = $(el).find('.elementor-post__thumbnail img').attr('src');
      
      if (title && link) {
        results.push({
          title,
          link,
          thumbnail,
          source: 'MalayalamSubtitles.in'
        });
      }
    });
    return results;
  } catch (err) {
    console.error('[Scraper] Error searching MalayalamSubtitles.in:', err);
    return [];
  }
};

/**
 * SCRAPER 2: moviemirrorsubtitles.com
 */
const searchMovieMirror = async (query) => {
  try {
    const searchUrl = `https://moviemirrorsubtitles.com/?s=${normalize(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('.elementor-post').each((i, el) => {
      const title = $(el).find('.elementor-post__title a').text().trim();
      const link = $(el).find('.elementor-post__title a').attr('href');
      const thumbnail = $(el).find('.elementor-post__thumbnail img').attr('src');
      
      if (title && link) {
        results.push({
          title,
          link,
          thumbnail,
          source: 'MovieMirrorSubtitles'
        });
      }
    });
    return results;
  } catch (err) {
    console.error('[Scraper] Error searching MovieMirror:', err);
    return [];
  }
};

/**
 * SCRAPER 3: malayalamsubtitles.org (MSone)
 */
const searchMSone = async (query) => {
  try {
    const searchUrl = `https://malayalamsubtitles.org/?s=${normalize(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('.elementor-post').each((i, el) => {
      const title = $(el).find('.elementor-post__title a').text().trim();
      const link = $(el).find('.elementor-post__title a').attr('href');
      const thumbnail = $(el).find('.elementor-post__thumbnail img').attr('src');
      
      if (title && link) {
        results.push({
          title,
          link,
          thumbnail,
          source: 'MSone'
        });
      }
    });
    return results;
  } catch (err) {
    console.error('[Scraper] Error searching MSone:', err);
    return [];
  }
};

/**
 * Extract Zip and find .srt file
 */
const extractSrtFromBuffer = (buffer) => {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    // Find the first .srt or .vtt file
    const srtEntry = zipEntries.find(entry => 
      entry.entryName.toLowerCase().endsWith('.srt') || 
      entry.entryName.toLowerCase().endsWith('.vtt')
    );
    
    if (srtEntry) {
      return srtEntry.getData();
    }
    return null;
  } catch (err) {
    console.error('[Scraper] Zip Extraction failed:', err);
    return null;
  }
};

/**
 * Helper to get direct download link from a page
 */
const getDirectDownloadLink = async (pageUrl, source) => {
  try {
    const response = await fetch(pageUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    let downloadLink = null;

    if (source === 'MalayalamSubtitles.in') {
      // Look for download buttons or direct .zip/.srt links
      downloadLink = $('a[href$=".zip"]').attr('href') || 
                     $('a[href$=".srt"]').attr('href') ||
                     $('.elementor-button-link[href*="download"]').attr('href');
    } else if (source === 'MovieMirrorSubtitles') {
      downloadLink = $('a[href$=".zip"]').attr('href') || 
                     $('a[href$=".srt"]').attr('href') ||
                     $('.elementor-button-link[href*="download"]').attr('href');
    } else if (source === 'MSone') {
      // MSone often uses a "പരിഭാഷ" button
      downloadLink = $('a:contains("പരിഭാഷ")').attr('href') || 
                     $('a[href*="download"]').attr('href');
    }

    if (downloadLink && !downloadLink.startsWith('http')) {
      const url = new URL(pageUrl);
      downloadLink = `${url.protocol}//${url.host}${downloadLink}`;
    }

    return downloadLink;
  } catch (err) {
    console.error(`[Scraper] Error getting direct link for ${source}:`, err);
    return null;
  }
};

module.exports = {
  searchMalayalamSubtitlesIn,
  searchMovieMirror,
  searchMSone,
  getDirectDownloadLink,
  extractSrtFromBuffer
};
