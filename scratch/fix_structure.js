const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// I will re-implement the entire main container part to be 100% sure
const mainHeaderRegex = /<main className={`flex-1 flex flex-col relative[^`]*`}>([\s\S]+?)<\/main>/;

// Reconstruction of the main container logic
const replacementMain = `
      <main className={\`flex-1 flex flex-col relative \${currentView === 'logs' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}\`}>
        <div className="max-w-full mx-auto w-full p-4 lg:p-4 pt-2 lg:pt-2 flex flex-col flex-1 gap-4">
          
          {/* Mobile Header */}
          <header className={\`lg:hidden flex flex-col sticky top-0 z-50 p-2\`}> 
             <div className={\`flex flex-col rounded-[2rem] border transition-all \${theme === 'dark' ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur-xl shadow-lg\`}>
                <div className="flex items-center justify-between p-4 px-6">
                   <div className="flex items-center gap-3">
                      <div className={\`\${a.main} p-2 rounded-xl\`}>
                         <Film className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-black tracking-tighter">SubStream</span>
                   </div>
                   <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 opacity-50 hover:opacity-100 transition-all">
                      {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                   </button>
                </div>
                
                {currentView === 'list' && !isNavOpen && (
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
                )}

                {isNavOpen && (
                   <div className={\`lg:hidden border-t \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'} animate-in slide-in-from-top duration-300\`}>
                      <nav className="p-4 space-y-1">
                         {[ 
                           { id: 'upload', label: 'Upload Feed', icon: Upload }, 
                           { id: 'search', label: 'Search & Import', icon: Globe },
                           { id: 'list', label: 'Manage Library', icon: Archive }, 
                           { id: 'logs', label: 'Live Traffic', icon: Shield } 
                         ].map((item) => (
                           <button key={item.id} onClick={() => { setCurrentView(item.id); if(item.id === 'list') fetchSubtitles(); setIsNavOpen(false); }} className={\`w-full flex items-center gap-4 px-6 py-3 rounded-xl \${currentView === item.id ? (theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-neutral-100/50 text-neutral-900') : 'opacity-40'}\`}>
                             <item.icon className={\`w-4 h-4 \${currentView === item.id ? a.text : ''}\`} /><span className="font-bold text-xs">{item.label}</span>
                           </button>
                         ))}
                         <div className={\`pt-4 mt-4 border-t \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'} flex items-center justify-between px-6 pb-2\`}>
                           <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={\`p-2 rounded-xl \${theme === 'dark' ? 'bg-neutral-850' : 'bg-neutral-200'}\`}>
                              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                           </button>
                           <button onClick={handleLogout} className="flex items-center gap-2 opacity-40 text-[10px] uppercase font-black"><LogOut className="w-4 h-4" /> Sign Out</button>
                         </div>
                      </nav>
                   </div>
                )}
             </div>
          </header>

          {/* Desktop Header */}
          <header className={\`hidden lg:flex sticky top-0 z-50 px-4 pt-4 mb-2\`}> 
             <div className={\`flex-1 flex items-center justify-between py-4 px-8 border rounded-full transition-all \${theme === 'dark' ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur-xl shadow-lg\`}>
                <div className="flex items-center gap-4">
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
                   <div className={\`flex items-center gap-2 p-1.5 rounded-xl border \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'}\`}>
                      <div className="flex gap-1.5 px-1">
                         {Object.keys(ACCENTS).map(c => (
                            <button key={c} onClick={() => setAccent(c)} className={\`w-4 h-4 rounded-full \${ACCENTS[c].main} transition-all \${accent === c ? 'ring-2 ring-offset-2 ring-white scale-110' : 'opacity-20 hover:opacity-100'}\`} />
                         ))}
                      </div>
                      <div className="w-px h-4 bg-neutral-800/50 mx-1" />
                      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={\`p-1 px-2 rounded-lg transition-all \${theme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-neutral-200'}\`}>
                         {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                   </div>
                   {currentView === 'list' && (
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                         <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={\`pl-8 pr-4 py-1.5 rounded-lg text-[10px] outline-none border transition-all \${theme === 'dark' ? 'bg-black border-neutral-800 focus:border-indigo-500' : 'bg-neutral-50 border-neutral-200 focus:border-indigo-400'}\`} placeholder="Search Library..." />
                      </div>
                   )}
                   {currentView === 'list' && <button onClick={fetchSubtitles} disabled={isRefreshing} className={\`p-2 rounded-lg opacity-40 hover:opacity-100 transition-all \${isRefreshing ? 'animate-spin' : ''}\`}><RefreshCw className="w-3.5 h-3.5" /></button>}
                </div>
             </div>
          </header>
`;

content = content.replace(mainHeaderRegex, replacementMain + '</main>');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Clean Sticky Layout Applied');
