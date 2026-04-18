
const cheerio = require('cheerio');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const fetch = require('node-fetch');

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
    // 1. Check if the pageUrl is ALREADY a direct download link
    let headRes = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      headRes = await fetch(pageUrl, { headers, method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
    } catch (e) {
      console.log(`[Scraper] HEAD request skipped or timed out for: ${pageUrl}`);
    }

    if (headRes) {
      const contentType = headRes.headers.get('content-type') || '';
      const contentDisposition = headRes.headers.get('content-disposition') || '';
      
      if (
        contentType.includes('application/zip') || 
        contentType.includes('application/x-zip') ||
        contentType.includes('application/octet-stream') ||
        contentDisposition.includes('attachment') ||
        pageUrl.toLowerCase().endsWith('.zip') || 
        pageUrl.toLowerCase().endsWith('.srt')
      ) {
        console.log(`[Scraper] Link is already a direct download: ${pageUrl}`);
        return pageUrl;
      }
    }

    // 2. Otherwise, fetch the HTML and find the download button
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
    console.log(`[Scraper] Inspecting page: ${pageUrl}`);
    const response = await fetch(pageUrl, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let imdbId = null;

    // 1. Look for ID in specifically likely containers (Info sections, lists)
    const prioritySelectors = [
      '.elementor-widget-container', 
      '.movie-info', 
      '.series-info',
      'a[href*="imdb.com/title/tt"]'
    ];

    for (const sel of prioritySelectors) {
      if (imdbId) break;
      $(sel).each((i, el) => {
        const text = $(el).text() + ($(el).attr('href') || '');
        const match = text.match(/tt\d{7,}/);
        if (match) {
          imdbId = match[0];
          return false;
        }
      });
    }

    // 2. Global search fallback
    if (!imdbId) {
      const globalMatch = html.match(/tt\d{7,}/);
      if (globalMatch) imdbId = globalMatch[0];
    }
    
    // 3. Type detection - look for specific markers
    const bodyText = $('body').text().toLowerCase();
    const headText = $('title').text().toLowerCase();
    const combinedText = bodyText + ' ' + headText;
    
    let type = 'movie';
    // More precise series markers
    const seriesMarkers = [
       'tv series', 'tv-series', 'web series', 'web-series', 
       'season 0', 'season 1', 'season 2', 'season 3', 'episode',
       'പരമ്പര', 'സീസൺ'
    ];
    
    if (seriesMarkers.some(m => combinedText.includes(m))) {
      type = 'series';
    }

    console.log(`[Scraper] Metadata detected - ID: ${imdbId}, Type: ${type}`);
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
