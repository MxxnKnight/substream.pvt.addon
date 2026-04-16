const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix Live Traffic Height to Fill Available Space
// Change the main container of the logs view to flex and h-full
content = content.replace(/currentView === 'logs' \? \(\n\s+<div className="w-full animate-in fade-in duration-700">/g, 
"currentView === 'logs' ? (\n            <div className=\"flex-1 w-full animate-in fade-in duration-700 flex flex-col\">");

content = content.replace(/<div className={`rounded-\[0\.8rem\] border overflow-hidden[^`]*`}>/g, 
"<div className={`flex-1 flex flex-col rounded-[0.8rem] border overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0f] border-neutral-800' : 'bg-black border-neutral-800'}`}>");

content = content.replace(/<div className="h-\[calc\(100vh-280px\)\] min-h-\[500px\] overflow-y-auto p-8 font-mono text-\[13px\] leading-relaxed custom-scrollbar bg-black\/20 selection:bg-emerald-500\/30">/g,
"<div className=\"flex-1 overflow-y-auto p-8 font-mono text-[13px] leading-relaxed custom-scrollbar bg-black/20 selection:bg-emerald-500/30\">");

// 2. Add Toggle to Mobile Header
// We want to add only if it's library view
content = content.replace(/\{isNavOpen \? <X className="w-5 h-5" \/> : <Menu className="w-5 h-5" \/>\}<\/button>\n\s+<\/div>/g, 
`{isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
             </div>
             {currentView === 'list' && !isNavOpen && (
                <div className="px-6 pb-4 order-last">
                   <div className={\`flex p-1 rounded-full \${theme === 'dark' ? 'bg-neutral-900/50' : 'bg-neutral-100'} border \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}\`}>
                      {['movie', 'series'].map(m => (
                         <button key={m} onClick={() => setMediaFilter(m)} className={\`flex-1 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${mediaFilter === m ? \`\${a.main} text-white\` : 'opacity-40'}\`}>{m}</button>
                      ))}
                   </div>
                </div>
             )}`);

// 3. Add Theme Selection to Desktop Header
const desktopHeaderEnd = /<div className="flex items-center gap-3">\n\s+\{currentView === 'list' && <div className="relative">/;
const themeDropdownMarkup = `<div className="flex items-center gap-3">
                <div className={\`flex items-center gap-2 p-1.5 rounded-xl border \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'}\`}>
                   <div className="flex gap-1.5 px-1">
                      {Object.keys(ACCENTS).map(c => (
                         <button key={c} onClick={() => setAccent(c)} className={\`w-4 h-4 rounded-full \${ACCENTS[c].main} transition-all \${accent === c ? 'ring-2 ring-offset-2 ring-white scale-110' : 'opacity-20 hover:opacity-100'}\`} />
                      ))}
                   </div>
                   <div className="w-px h-4 bg-neutral-800/50 mx-1" />
                   <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1 px-2 rounded-lg hover:bg-neutral-800 transition-all">
                      {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                   </button>
                </div>
                {currentView === 'list' && <div className="relative">`;

content = content.replace(desktopHeaderEnd, themeDropdownMarkup);

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Final Expansion & Theme Menu Applied');
