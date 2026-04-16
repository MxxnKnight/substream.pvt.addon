const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix Layout to Sticky Capsule (Pushing content down naturally)
// Mobile Header
content = content.replace(/header className={`lg:hidden flex flex-col fixed top-3 left-3 right-3 z-50 rounded-\[2rem\] border transition-all \${theme === 'dark' \? 'bg-black\/90 border-neutral-800' : 'bg-white\/95 border-neutral-200'} backdrop-blur-xl shadow-lg`}/g,
"header className={`lg:hidden flex flex-col sticky top-0 z-50 p-3`}> \n             <div className={`flex flex-col rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur-xl shadow-lg`}");

// Desktop Header
content = content.replace(/header className={`hidden lg:flex items-center justify-between fixed top-4 left-4 lg:left-\[calc\(288px\+1\.5rem\)\] right-4 z-50 py-4 px-8 border rounded-full transition-all \${theme === 'dark' \? 'bg-black\/80 border-neutral-800' : 'bg-white\/80 border-neutral-200'} backdrop-blur-xl shadow-md`}/g,
"header className={`hidden lg:flex sticky top-0 z-50 px-4 pt-4`}> \n             <div className={`flex-1 flex items-center justify-between py-4 px-8 border rounded-full transition-all ${theme === 'dark' ? 'bg-black/80 border-neutral-800' : 'bg-white/80 border-neutral-200'} backdrop-blur-xl shadow-md`}");

// Add the missing closing divs for both headers
content = content.replace(/<\/header>\n\s+\{currentView === 'upload' \?/g, "</div></header>\n\n          {currentView === 'upload' ?");

// 2. Add Search Option to Mobile Header
const mobileLibrarySection = `\n             {currentView === 'list' && !isNavOpen && (
                <div className="px-6 pb-5 space-y-3">
                   <div className={\`flex p-1 rounded-full \${theme === 'dark' ? 'bg-neutral-900/50' : 'bg-neutral-100'} border \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}\`}>
                      {['movie', 'series'].map(m => (
                         <button key={m} onClick={() => setMediaFilter(m)} className={\`flex-1 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${mediaFilter === m ? \`\${a.main} text-white\` : 'opacity-40'}\`}>{m}</button>
                      ))}
                   </div>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={\`w-full pl-8 pr-4 py-2 rounded-xl text-[10px] outline-none border transition-all \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'}\`} placeholder="Search IMDB or Files..." />
                   </div>
                </div>
             )}`;

content = content.replace(/\{currentView === 'list' && !isNavOpen && \([\s\S]+?\}\)/, mobileLibrarySection);

// 3. Remove excessive top margin since header is now sticky
content = content.replace(/pt-24 lg:pt-24/g, 'pt-2 lg:pt-2');

// 4. Fix Logs View scrolling
content = content.replace(/main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative"/g, 
"main className={`flex-1 flex flex-col relative \${currentView === 'logs' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}");

// 5. Drawer Theme Button Visibility & Mobile Dropdowns
content = content.replace(/p-2 rounded-xl bg-neutral-800/g, "`p-2 rounded-xl ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`");
content = content.replace(/border-t border-neutral-800/g, "`border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`");

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Sticky Capsule & Search applied');
