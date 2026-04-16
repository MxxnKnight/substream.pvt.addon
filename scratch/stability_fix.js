const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Prevent Library Crash (Safe filtering)
content = content.replace(/\.filter\(s => s\.type === mediaFilter && \(s\.title\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| \(s\.imdbId && s\.imdbId\.includes\(searchQuery\)\)\)\)/g,
`.filter(s => {
                        const title = s?.title?.toLowerCase() || '';
                        const imdbId = s?.imdbId || '';
                        const query = searchQuery?.toLowerCase() || '';
                        return s?.type === mediaFilter && (title.includes(query) || imdbId.includes(query));
                      })`);

// 2. Fix Live Traffic Responsiveness & Bottom Margin
// Make sure the main terminal container has horizontal padding and a bottom margin
content = content.replace(/<div className="flex-1 overflow-y-auto p-8 font-mono text-\[13px\] leading-relaxed custom-scrollbar bg-black\/20 selection:bg-emerald-500\/30">/g,
'<div className="flex-1 overflow-y-auto p-4 lg:p-10 pb-20 font-mono text-[11px] lg:text-[13px] leading-relaxed custom-scrollbar bg-black/20 selection:bg-emerald-500/30 w-full overflow-x-hidden">');

// 3. Add Bottom Margin to the whole main container
content = content.replace(/p-4 lg:p-4 pt-2 lg:pt-2/g, 'p-4 lg:p-10 pt-4 lg:pt-6 pb-20');

// 4. Double check Subtitle access in map
content = content.replace(/const first = sub\.files\[0\] \|\| \{\};/g, 'const first = sub?.files?.[0] || {};');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Stability & Layout Fix applied');
