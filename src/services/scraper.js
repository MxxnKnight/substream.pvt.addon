
const cheerio = require('cheerio');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Dynamically import fetch for Node versions where it's not global
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.37 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.37';

const headers = { 'User-Agent': USER_AGENT };

/**
 * Normalizes movie name for search
 */
const normalize = (q) => encodeURIComponent(q.trim());

/**
 * SCRAPER 1: malayalamsubtitles.in
 */
const searchMalayalamSubtitlesIn = async (query) => {
  try {
    // For Team GOAT, we'll fetch their search-and-download page and filter
    const url = `https://malayalamsubtitles.in/search-and-download/`;
    const response = await fetch(url, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    const q = query.toLowerCase().trim();

    $('div.card').each((i, el) => {
      const title = $(el).find('h5').text().trim();
      const link = $(el).find('a.download-button').attr('href') || $(el).find('a').attr('href');
      
      if (title.toLowerCase().includes(q)) {
        results.push({
          title,
          link,
          thumbnail: null,
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
    // For MovieMirror, fetch their main subtitles page
    const url = `https://moviemirrorsubtitles.com/subtitles/`;
    const response = await fetch(url, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    const q = query.toLowerCase().trim();

    // The grid items contain h3 for titles
    $('h3').each((i, el) => {
      const title = $(el).text().trim();
      const parent = $(el).parent();
      const link = parent.find('a.sub-btn').attr('href') || parent.attr('href');
      const thumbnail = parent.find('img').attr('src');
      
      if (title.toLowerCase().includes(q)) {
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
    const response = await fetch(searchUrl, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = [];
    $('article.entry').each((i, el) => {
      const title = $(el).find('h2.entry-title a').text().trim();
      const link = $(el).find('h2.entry-title a').attr('href');
      const thumbnail = $(el).find('.post-thumbnail img').attr('src');
      
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
 * Extract all .srt files from a Zip buffer
 */
const extractAllSrtsFromBuffer = (buffer) => {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    const srts = zipEntries
      .filter(entry => !entry.isDirectory && (entry.entryName.toLowerCase().endsWith('.srt') || entry.entryName.toLowerCase().endsWith('.vtt')))
      .map(entry => ({
        name: entry.entryName.split('/').pop(),
        data: entry.getData()
      }));
    
    return srts;
  } catch (err) {
    console.error('[Scraper] Zip Extraction failed:', err);
    return [];
  }
};

/**
 * Detects season and episode from a filename
 */
const detectSeasonEpisode = (filename) => {
  const name = filename.toLowerCase();
  // Patterns: S01E02, 1x02, S1-E2, Episode 02
  const sMatch = name.match(/s(\d+)/i);
  const eMatch = name.match(/e(\d+)/i) || name.match(/(\d+)x(\d+)/i);
  
  let season = sMatch ? parseInt(sMatch[1], 10) : null;
  let episode = null;
  
  if (name.match(/(\d+)x(\d+)/i)) {
    const match = name.match(/(\d+)x(\d+)/i);
    season = parseInt(match[1], 10);
    episode = parseInt(match[2], 10);
  } else if (eMatch) {
    episode = parseInt(eMatch[1], 10);
  } else {
    // Try to find a single number like "02.srt"
    const numMatch = name.match(/(\d+)/);
    if (numMatch) episode = parseInt(numMatch[1], 10);
  }
  
  return { season, episode };
};


/**
 * Helper to get direct download link from a page
 */
const getDirectDownloadLink = async (pageUrl, source) => {
  try {
    const response = await fetch(pageUrl, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    let downloadLink = null;

    if (source === 'MalayalamSubtitles.in') {
      downloadLink = $('a[href$=".zip"]').attr('href') || 
                     $('a[href$=".srt"]').attr('href') ||
                     $('.elementor-button-link[href*="download"]').attr('href') ||
                     $('a:contains("Download")').attr('href');
    } else if (source === 'MovieMirrorSubtitles') {
      downloadLink = $('a[href$=".zip"]').attr('href') || 
                     $('a[href$=".srt"]').attr('href') ||
                     $('.elementor-button-link[href*="download"]').attr('href') ||
                     $('a:contains("Download")').attr('href');
    } else if (source === 'MSone') {
      downloadLink = $('a:contains("പരിഭാഷ")').attr('href') || 
                     $('a[href*="download"]').attr('href') ||
                     $('a.elementor-button').attr('href');
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

/**
 * Scrapes IMDb ID from a page
 */
const getMetadataFromPage = async (pageUrl) => {
  try {
    const response = await fetch(pageUrl, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for IMDb link - more comprehensive patterns
    let imdbId = null;
    const selectors = [
      'a[href*="imdb.com/title/tt"]',
      'a.imdb-link',
      'a.imdb-button',
      '.imdb-id',
      'span:contains("IMDb")',
      'a:contains("IMDb")'
    ];

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length > 0) {
        const href = el.attr('href');
        const text = el.text() || '';
        
        // Match link text exactly or with icon
        if (text.toLowerCase().includes('imdb')) {
           const idInParent = el.closest('div, p, span').text().match(/tt\d{7,}/);
           if (idInParent) {
             imdbId = idInParent[0];
             break;
           }
        }

        // Check href
        const hrefMatch = href?.match(/tt\d{7,}/);
        if (hrefMatch) {
          imdbId = hrefMatch[0];
          break;
        }
      }
    }
    
    // Fallback: Global regex search in the entire HTML
    if (!imdbId) {
      const globalMatch = html.match(/tt\d{7,}/);
      if (globalMatch) imdbId = globalMatch[0];
    }
    
    // Also check if it mentions Movie or Series/Season/TV
    const bodyText = $('body').text().toLowerCase();
    let type = 'movie';
    if (bodyText.includes('series') || bodyText.includes('season') || bodyText.includes('episode') || bodyText.includes('പരമ്പര')) {
      type = 'series';
    }

    return { imdbId, type };
  } catch (err) {
    console.error('[Scraper] Error getting metadata from page:', err);
    return { imdbId: null, type: 'movie' };
  }
};

module.exports = {
  searchMalayalamSubtitlesIn,
  searchMovieMirror,
  searchMSone,
  getDirectDownloadLink,
  extractAllSrtsFromBuffer,
  detectSeasonEpisode,
  getMetadataFromPage
};
