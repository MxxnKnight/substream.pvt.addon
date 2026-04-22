
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
      // The release page link is usually the first <a> (often wrapping the title)
      const pageLink = $(el).find('a').attr('href');
      // The download handler link is specifically the a.download-button
      const downloadLink = $(el).find('a.download-button').attr('href');
      
      if (title.toLowerCase().includes(q)) {
        results.push({
          title,
          link: pageLink,
          downloadLink,
          thumbnail: null, // Team GOAT cards lack thumbnails in search mode
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

    // Movie Mirror updated structure uses h2 a for links
    $('article').each((i, el) => {
      const title = $(el).find('h2 a').text().trim() || $(el).find('.prod-blk11 h3').text().trim();
      const link = $(el).find('h2 a').attr('href') || $(el).find('.prod-blk11 a.sub-btn').attr('href');
      const thumbnail = $(el).find('.post-thumbnail img').attr('src') || $(el).find('.prod-blk img').attr('src');
      
      if (title && title.toLowerCase().includes(q)) {
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
    
    // Support .srt, .vtt and handle case-insensitivity (.SRT)
    const validExtensions = ['.srt', '.vtt'];
    
    const srts = zipEntries
      .filter(entry => {
        if (entry.isDirectory) return false;
        const name = entry.entryName.toLowerCase();
        return validExtensions.some(ext => name.endsWith(ext));
      })
      .map(entry => {
        // preserve original filename from ZIP path, cleaning up excessive underscores
        const pathParts = entry.entryName.replace(/\\/g, '/').split('/');
        let rawName = pathParts.pop();
        // Normalize: replace multiple underscores with a single one, trim edges
        rawName = rawName.replace(/_+/g, '_').replace(/^_|_$/g, '');
        
        return {
          name: rawName,
          data: entry.getData()
        };
      });
    
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
  const name = filename.toLowerCase().replace(/_/g, ' ');
  
  // Patterns: S01E02, 1x02, S1-E2, Episode 02, Chapter 1, Night 1, Part 1
  const sMatch = name.match(/s(?:eason)?\s*(\d+)/i);
  const eMatch = name.match(/e(?:pisode)?\s*(\d+)/i) || 
                 name.match(/chapter\s*(\d+)/i) || 
                 name.match(/night\s*(\d+)/i) || 
                 name.match(/part\s*(\d+)/i) ||
                 name.match(/(\d+)x(\d+)/i);
  
  let season = sMatch ? parseInt(sMatch[1], 10) : null;
  let episode = null;
  
  // Handlers for specific formats
  if (name.match(/(\d+)\s*x\s*(\d+)/i)) {
    const match = name.match(/(\d+)\s*x\s*(\d+)/i);
    season = parseInt(match[1], 10);
    episode = parseInt(match[2], 10);
  } else if (eMatch) {
    const match = eMatch;
    episode = parseInt(match[1], 10);
  } else {
    // Fallback: Detect single numbers like "02.srt" or "1-01.srt"
    const genericMatch = name.match(/(?:^|\D)(\d+)\s*(?:-|_)\s*(\d+)(?:\D|$)/); // 1-01
    if (genericMatch) {
      if (!season) season = parseInt(genericMatch[1], 10);
      episode = parseInt(genericMatch[2], 10);
    } else {
      // Find the isolated number closest to the end of the filename (before extension)
      const numMatch = name.match(/(?:^|\D)(\d+)(?:\.\w+)?$/);
      if (numMatch) episode = parseInt(numMatch[1], 10);
    }
  }

  // Fallback if no season detect but episode is found, default to S1
  if (episode !== null && season === null) {
      season = 1;
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
      downloadLink = $('a.download-button').attr('href') || 
                     $('a[href$=".zip"]').attr('href') || 
                     $('a[href$=".srt"]').attr('href') ||
                     $('.elementor-button-link[href*="download"]').attr('href');
    } else if (source === 'MovieMirrorSubtitles') {
      downloadLink = $('a[href$=".zip"]').attr('href') || 
                     $('a[href$=".srt"]').attr('href') ||
                     $('.elementor-button-link[href*="download"]').attr('href') ||
                     $('a:contains("download")').attr('href') ||
                     $('a:contains("Download")').attr('href');
    } else if (source === 'MSone') {
      // MSone buttons often link to /releases/ which handles the redirect
      const releasesLink = $('a[href*="/releases/"]').attr('href');
      if (releasesLink) {
         // Follow the redirect
         const redirectResponse = await fetch(releasesLink, { headers, redirect: 'follow' });
         const redirectUrl = redirectResponse.url;
         
         // If the redirector lands on an HTML page instead of a file, we need a second hop
         const contentType = redirectResponse.headers.get('content-type') || '';
         if (contentType.includes('text/html')) {
             const innerHtml = await redirectResponse.text();
             const $inner = cheerio.load(innerHtml);
             const deeperLink = $inner('a[href$=".zip"]').attr('href') || 
                                $inner('a[href*="drive.google"]').attr('href') ||
                                $inner('a:contains("Download")').attr('href');
             if (deeperLink) return deeperLink.startsWith('http') ? deeperLink : new URL(deeperLink, redirectUrl).href;
         }
         return redirectUrl;
      }
      
      downloadLink = $('a:contains("പരിഭാഷ")').attr('href') || 
                     $('a[href*="subtitle"]').attr('href') ||
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
    let poster = null;
    let type = 'movie';

    // 1. Look for specific ID markers first
    const specificIdSelectors = [
      'a#imdb-button',
      'a.imdb-badge',
      'a[href*="imdb.com/title/tt"]'
    ];

    for (const sel of specificIdSelectors) {
      const match = $(sel).attr('href')?.match(/tt\d{7,}/);
      if (match) {
        imdbId = match[0];
        break;
      }
    }

    // 2. Global search fallback for IMDb ID
    if (!imdbId) {
      const globalMatch = html.match(/tt\d{7,}/);
      if (globalMatch) imdbId = globalMatch[0];
    }

    // 3. Type detection - look for MSone's explicit type button or markers
    const explicitType = $('#release-type-button').text().toLowerCase();
    if (explicitType.includes('series') || explicitType.includes('പരമ്പര')) {
      type = 'series';
    } else {
      const combinedText = $('body').text().toLowerCase() + ' ' + $('title').text().toLowerCase();
      const seriesMarkers = ['tv series', 'tv-series', 'web series', 'web-series', 'season 0', 'season 1', 'season 2', 'episode', 'പരമ്പര', 'സീസൺ'];
      if (seriesMarkers.some(m => combinedText.includes(m))) type = 'series';
    }

    // 4. Poster extraction (Second Hop logic)
    poster = $('meta[property="og:image"]').attr('content') || 
             $('.post-thumbnail img').attr('src') || 
             $('.attachment-large').attr('src') ||
             $('article img').first().attr('src');

    console.log(`[Scraper] Metadata detected - ID: ${imdbId}, Type: ${type}, Poster: ${poster ? 'Yes' : 'No'}`);
    return { imdbId, type, poster };
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
