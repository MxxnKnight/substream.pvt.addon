const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix fetchSubtitles to group items by IMDb ID so the UI can render "Cards with file packs"
const fetchSubtitlesReplacement = `
  const fetchSubtitles = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiFetch('/api/admin/subtitles');
      if (res.ok) {
        const data = await res.json();
        // Group by IMDb ID
        const groups = {};
        data.forEach(sub => {
          const id = sub.imdb_id;
          if (!groups[id]) {
            groups[id] = {
              imdbId: id,
              title: sub.metadata?.title || 'Unknown Title',
              type: sub.type,
              files: []
            };
          }
          groups[id].files.push({
            id: sub.id,
            filename: decodeURIComponent(sub.file_path.split('/').pop()).replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/, ''),
            season: sub.season,
            episode: sub.episode,
            language: sub.language,
            poster_path: sub.metadata?.poster_path,
            type: sub.type
          });
        });
        setSubtitles(Object.values(groups));
      }
    } catch (err) {
      console.error("Failed to fetch subtitles", err);
    } finally {
      setIsRefreshing(false);
    }
  };`;

content = content.replace(/const fetchSubtitles = async \(\) => \{[\s\S]+?setIsRefreshing\(false\);\s+\}\s+\};/, fetchSubtitlesReplacement);

// 2. Fix the safe filter in the UI to handle the grouped structure
content = content.replace(/\.filter\(s => \{[\s\S]+?\}\)/, 
`.filter(s => {
                        const title = s?.title?.toLowerCase() || '';
                        const imdbId = s?.imdbId || '';
                        const query = searchQuery?.toLowerCase() || '';
                        return s?.type === mediaFilter && (title.includes(query) || imdbId.includes(query));
                      })`);

// 3. Ensure sub.files is always checked
content = content.replace(/\{sub\.files\.map\(/g, '{sub?.files?.map(');

// 4. Fix the "down ha no margin" and responsive logs
// Ensure the logs container is full width and has padding
content = content.replace(/<div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col">/g,
'<div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col pb-10">');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Library Grouping & Margin Fix applied');
