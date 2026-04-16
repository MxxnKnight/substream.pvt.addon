const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix Mobile Header
// Find the first header and replace it entirely
const mobileHeaderRegex = /<header className={`lg:hidden flex flex-col gap-4 p-5 mx-4 rounded-\[2\.5rem\] fixed top-\[15px\][^>]+>([\s\S]+?)<\/header>/;
const mobileHeaderReplacement = `<header className={\`lg:hidden flex flex-col border-b \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'} sticky top-0 z-50\`}>
             <div className="flex items-center justify-between p-4 px-6">
                <div className="flex items-center gap-3"><div className={\`\${a.main} p-2 rounded-xl\`}>
                   <Film className="w-4 h-4 text-white" />
                </div><span className="font-black tracking-tighter">SubStream</span></div>
                <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 opacity-50 hover:opacity-100 transition-all">{isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
             </div>
             {isNavOpen && (
                <div className={\`lg:hidden border-t \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'} animate-in slide-in-from-top duration-300\`}>
                   <nav className="p-4 space-y-1">
                      {[ 
                        { id: 'upload', label: 'Upload Feed', icon: Upload }, 
                        { id: 'search', label: 'Search & Import', icon: Globe },
                        { id: 'list', label: 'Manage Library', icon: Archive }, 
                        { id: 'logs', label: 'Live Traffic', icon: Shield } 
                      ].map((item) => (
                        <button key={item.id} onClick={() => { setCurrentView(item.id); if(item.id === 'list') fetchSubtitles(); setIsNavOpen(false); }} className={\`w-full flex items-center gap-4 px-6 py-3 rounded-xl \${currentView === item.id ? (theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900') : 'opacity-40'}\`}>
                          <item.icon className={\`w-4 h-4 \${currentView === item.id ? a.text : ''}\`} /><span className="font-bold text-xs">{item.label}</span>
                        </button>
                      ))}
                      <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between px-6 pb-2">
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl bg-neutral-800">{theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button>
                        <button onClick={handleLogout} className="flex items-center gap-2 opacity-40 text-[10px] uppercase font-black"><LogOut className="w-4 h-4" /> Sign Out</button>
                      </div>
                   </nav>
                </div>
             )}
          </header>`;

content = content.replace(mobileHeaderRegex, mobileHeaderReplacement);

// 2. Fix Desktop Header
const desktopHeaderRegex = /<header className={`hidden lg:flex items-center justify-between fixed top-\[15px\][^>]+>([\s\S]+?)<\/header>/;
const desktopHeaderReplacement = `<header className={\`hidden lg:flex items-center justify-between sticky top-0 z-50 py-4 px-8 border-b transition-all \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'} backdrop-blur-xl\`}>
             <div className="flex items-center gap-8">
                <h2 className="text-lg font-black tracking-tight">{currentView === 'upload' ? 'Upload Feed' : currentView === 'list' ? 'SubView Library' : currentView === 'search' ? 'Search & Import' : 'Live Traffic'}</h2>
                {currentView === 'list' && (
                  <div className={\`flex p-1 rounded-full \${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'} border \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}\`}>
                    {['movie', 'series'].map(m => (
                      <button key={m} onClick={() => setMediaFilter(m)} className={\`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all \${mediaFilter === m ? \`\${a.main} text-white\` : 'opacity-40 hover:opacity-100'}\`}>{m}</button>
                    ))}
                  </div>
                )}
             </div>
             <div className="flex items-center gap-3">
                {currentView === 'list' && <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={\`pl-8 pr-4 py-1.5 rounded-lg text-[10px] outline-none border transition-all \${theme === 'dark' ? 'bg-neutral-900 border-neutral-800 focus:border-indigo-500' : 'bg-neutral-50 border-neutral-200 focus:border-indigo-400'}\`} placeholder="Search IMDB or Files..." /></div>}
                {currentView === 'list' && <button onClick={fetchSubtitles} disabled={isRefreshing} className={\`p-2 rounded-lg opacity-40 hover:opacity-100 transition-all \${isRefreshing ? 'animate-spin' : ''}\`}><RefreshCw className="w-3.5 h-3.5" /></button>}
             </div>
          </header>`;

content = content.replace(desktopHeaderRegex, desktopHeaderReplacement);

// 3. Remove the spacer completely or set to 0
content = content.replace(/<div className="h-2 lg:h-4 shrink-0" \/>/g, '');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Final Layout Applied');
