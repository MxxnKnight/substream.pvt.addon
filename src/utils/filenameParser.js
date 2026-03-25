
const parseFilename = (filename) => {
  const name = filename.replace(/\.(srt|vtt|zip)$/i, '');

  // Pattern 1: S01E01, s01e01
  const sxxexx = /[Ss](\d{1,2})[Ee](\d{1,2})/;
  const match1 = name.match(sxxexx);
  if (match1) {
    return { season: parseInt(match1[1], 10), episode: parseInt(match1[2], 10) };
  }

  // Pattern 2: 1x01
  const nxnn = /(\d{1,2})x(\d{1,2})/;
  const match2 = name.match(nxnn);
  if (match2) {
    return { season: parseInt(match2[1], 10), episode: parseInt(match2[2], 10) };
  }

  // Pattern 3: Episode 01
  const episodexx = /Episode\s*(\d+)/i;
  const match3 = name.match(episodexx);
  if (match3) {
    return { season: 1, episode: parseInt(match3[1], 10) };
  }

  // Pattern 4: Anime absolute numbering (e.g., 101)
  // Look for 3 or 4 digit numbers that are NOT likely years.
  const numbers = name.match(/(\d{3,4})/g);
  if (numbers) {
      // Filter out probable years (1950-2050)
      const potentialEpisodes = numbers.filter(n => {
          const val = parseInt(n, 10);
          return val < 1900 || val > 2100;
      });

      if (potentialEpisodes.length > 0) {
          // Take the last valid number found as the episode
          const episode = parseInt(potentialEpisodes[potentialEpisodes.length - 1], 10);
          return { season: 1, episode: episode };
      }
  }

  return null;
};

module.exports = { parseFilename };
