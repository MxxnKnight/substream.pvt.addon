const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// I will re-implement the entire main container part with all content blocks restored
const mainHeaderRegex = /<main className={`flex-1 flex flex-col relative[^`]*`}>([\s\S]+?)<\/main>/;

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
                           <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={\`p-2 rounded-xl \${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}\`}>
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

          {/* PAGE CONTENT BLOCKS */}
          {currentView === 'upload' ? (
            <div className="max-w-full mx-auto w-full animate-in fade-in duration-700">
              <div className={\`rounded-[1rem] border p-6 lg:p-10 \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-100'}\`}>
                <form className="space-y-8">
                  <div className="flex gap-4">
                    {['movie', 'series'].map(t => (
                      <button key={t} type="button" onClick={() => setUploadForm({...uploadForm, type: t})} className={\`flex-1 p-6 rounded-[0.8rem] border-2 transition-all flex flex-col items-center gap-3 \${uploadForm.type === t ? \`\${a.main} border-transparent text-white \${a.shadow}\` : \`\${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-100'}\`}\`}>
                         {t === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase opacity-40 px-2">Subtitle Language</label><div className="flex gap-2">{[ {code: 'eng', label: 'English'}, {code: 'mal', label: 'Malayalam'} ].map(l => <button key={l.code} type="button" onClick={() => setUploadForm({...uploadForm, language: l.code})} className={\`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all \${uploadForm.language === l.code ? \`\${a.main} border-transparent text-white\` : \`\${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-100 border-transparent'}\`}\`}>{l.label}</button>)}</div></div>
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase opacity-40 px-2">IMDB Identity</label><div className="relative"><input type="text" value={uploadForm.imdbId} onChange={handleImdbChange} placeholder="tt1234567" className={\`w-full py-3.5 px-4 rounded-xl border-2 outline-none font-mono text-xs \${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-transparent focus:bg-white'}\`} />{isMetadataLoading && <RefreshCw className={\`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 \${a.text} animate-spin\`} />}</div></div>
                  </div>
                  {currentMetadata && <div className={\`flex gap-6 p-4 rounded-[0.8rem] border-2 animate-in slide-in-from-left-4 \${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-100'}\`}>{currentMetadata.poster_path ? <img src={currentMetadata.poster_path} alt="Poster" className="w-16 h-24 object-cover rounded-xl" /> : <div className="w-16 h-24 bg-black rounded-xl" />}<div className="flex flex-col justify-center min-w-0"><h4 className="font-black text-lg truncate">{currentMetadata.title}</h4><p className="text-[10px] opacity-40 line-clamp-2">{currentMetadata.overview}</p></div></div>}
                  <div onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop} className={\`min-h-[160px] border-4 border-dashed rounded-[1rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer \${theme === 'dark' ? 'border-neutral-800 bg-[#0a0a0a]/20 hover:border-indigo-500/50' : 'border-neutral-100 bg-neutral-50 hover:border-indigo-400'}\`} onClick={()=>fileInputRef.current.click()}><input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelection} /><Archive className="w-8 h-8 opacity-20 mb-4" /><p className="text-[10px] font-black uppercase tracking-widest opacity-40">Drop packs or click to select</p></div>
                  {stagedFiles.length > 0 && <div className={\`rounded-2xl border divide-y overflow-hidden \${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800 divide-neutral-800' : 'bg-neutral-50 border-neutral-100 divide-neutral-100'}\`}>{stagedFiles.map((f, i) => <div key={i} className="flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors"><div className="flex items-center gap-3 min-w-0"><div className="p-2 rounded-lg bg-black"><FileText className="w-3 h-3 opacity-40" /></div><span className="text-xs font-bold truncate opacity-80">{f.name}</span></div><button type="button" onClick={()=>removeStagedFile(i)} className="p-2 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button></div>)}</div>}
                  <button type="button" onClick={handleUploadSubmit} disabled={!uploadForm.imdbId || stagedFiles.length === 0 || isUploading} className={\`w-full py-5 rounded-2xl font-black text-white transition-all \${!uploadForm.imdbId || stagedFiles.length === 0 || isUploading ? 'opacity-20 cursor-not-allowed' : \`\${a.main} \${a.hover} active:scale-95\`}\`}>{isUploading ? 'Synchronizing Cluster...' : \`Commit \${stagedFiles.length} Subtitles\`}</button>
                  {uploadSuccess && <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase text-center border border-emerald-500/20">Protocol Complete. Cluster Updated.</div>}
                </form>
              </div>
            </div>
          ) : currentView === 'search' ? (
            <div className="max-w-full mx-auto w-full animate-in fade-in duration-700 space-y-6">
               <div className={\`rounded-[1rem] border p-6 lg:p-10 \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-100'}\`}>
                  <form onSubmit={searchExternal} className="flex gap-4">
                     <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                        <input type="text" value={externalSearchQuery} onChange={(e) => setExternalSearchQuery(e.target.value)} placeholder="Search Malayalam Subtitles by Name..." className={\`w-full py-4 pl-12 pr-4 rounded-2xl border-2 outline-none font-bold \${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-transparent focus:bg-white'}\`} />
                     </div>
                     <button type="submit" disabled={isSearchingExternal} className={\`px-8 rounded-2xl font-black text-white \${a.main} \${a.hover} transition-all active:scale-95 disabled:opacity-50\`}>
                        {isSearchingExternal ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
                     </button>
                  </form>
                  {externalResults.length > 0 && (
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {externalResults.map((result, idx) => {
                          const status = importStatus[result.link] || 'idle';
                          return (
                            <div key={idx} className={\`p-6 rounded-[0.8rem] border-2 flex flex-col gap-4 group transition-all hover:scale-[1.02] \${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800 hover:border-indigo-500/50' : 'bg-neutral-50 border-neutral-100 hover:border-indigo-400'}\`}>
                               <div className="flex gap-4 items-start">
                                  {result.thumbnail ? <img src={result.thumbnail} className="w-16 h-20 object-cover rounded-xl" alt="" /> : <div className="w-16 h-20 bg-black rounded-xl flex items-center justify-center"><Film className="w-6 h-6 opacity-20" /></div>}
                                  <div className="flex-1 min-w-0">
                                     <span className="text-[8px] font-black uppercase opacity-40 px-2 py-0.5 rounded-full bg-neutral-800 text-white mb-2 inline-block">{result.source}</span>
                                     <h3 className="font-black text-sm truncate">{result.title}</h3>
                                     <div className="flex flex-wrap gap-2 mt-2">
                                        <div className={\`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase \${theme === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100 text-neutral-600'}\`}>
                                           <Globe className="w-2.5 h-2.5 opacity-40" />
                                           {result.type || 'Detecting...'}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <div className="space-y-3 pt-2">
                                  <div className="flex gap-2">
                                     <input 
                                       type="text" 
                                       value={result.imdbId || ''} 
                                       onChange={(e) => {
                                         const newRes = [...externalResults];
                                         newRes[idx].imdbId = e.target.value;
                                         setExternalResults(newRes);
                                       }}
                                       placeholder="IMDb ID..."
                                       className={\`flex-1 px-3 py-2 rounded-lg text-[10px] font-mono outline-none border \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}\`}
                                     />
                                     <button 
                                       onClick={() => inspectLink(result)}
                                       className={\`p-2 rounded-lg border \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'} \${status === 'inspecting' ? 'animate-spin' : ''}\`}
                                     >
                                        <RefreshCw className="w-3.5 h-3.5 opacity-40" />
                                     </button>
                                     <button 
                                       onClick={() => importExternal(result, result.imdbId, result.type || 'movie', result.season, result.episode)}
                                       disabled={status !== 'idle' && status !== 'error'}
                                       className={\`flex-1 py-2 rounded-lg font-black text-[10px] text-white transition-all \${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : \`\${a.main} hover:opacity-90\`}\`}
                                     >
                                        {status === 'importing' ? 'Importing...' : status === 'success' ? 'Imported' : status === 'error' ? 'Failed' : 'Import'}
                                     </button>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                  )}
               </div>
            </div>
          ) : currentView === 'list' ? (
            <div className="max-w-full mx-auto w-full animate-in fade-in duration-700">
               {subtitles.length === 0 ? (
                 <div className="mt-40 text-center opacity-30">
                    <Archive className="w-16 h-16 mx-auto mb-6" />
                    <p className="text-sm font-black uppercase tracking-widest">Library Empty</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {subtitles
                      .filter(s => s.type === mediaFilter && (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.imdbId && s.imdbId.includes(searchQuery))))
                      .map((sub, idx) => {
                        const first = sub.files[0] || {};
                        const isSeries = sub.type === 'series';
                        return (
                          <div key={idx} className={\`p-6 rounded-[0.8rem] border-2 transition-all hover:scale-[1.02] \${theme === 'dark' ? 'bg-black border-neutral-800 hover:border-indigo-500/50' : 'bg-white border-neutral-100 hover:border-indigo-400'}\`}>
                             <div className="flex gap-5 mb-6">
                                {first.poster_path ? <img src={first.poster_path} className="w-16 h-24 object-cover rounded-xl " alt="" /> : <div className="w-16 h-24 bg-black rounded-xl" />}
                                <div className="min-w-0 flex-1">
                                   <div className="flex gap-2 mb-2">
                                      <span className={\`text-[6px] font-black uppercase px-2 py-0.5 rounded-full \${isSeries ? 'bg-purple-600' : 'bg-indigo-600'} text-white shadow-sm\`}>{first.type}</span>
                                      {isSeries && first.season != null && <span className="text-[6px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-700 text-white shadow-sm">S{String(first.season).padStart(2,'0')}</span>}
                                   </div>
                                   <h3 className="font-black text-sm truncate leading-tight mb-1">{sub.title}</h3>
                                   <p className="text-[10px] font-mono opacity-30 mb-3">{sub.imdbId}</p>
                                </div>
                             </div>
                             <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                {sub.files.map((file, fIdx) => (
                                   <div key={fIdx} className={\`p-2.5 rounded-xl text-[10px] border \${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-neutral-50 border-neutral-100'}\`}>
                                      <p className="truncate opacity-80">{file.filename.split('-').slice(1).join('-') || file.filename}</p>
                                      {isSeries && (
                                        <p className="text-[8px] opacity-40 mt-1 uppercase font-bold">
                                          Season {file.season} {file.episode ? \`— Episode \${file.episode}\` : ''}
                                        </p>
                                      )}
                                   </div>
                                ))}
                             </div>
                             <div className="mt-6 pt-6 border-t border-neutral-800/50 flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                <span className="text-emerald-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Synced</span>
                                <button className="opacity-30 hover:opacity-100 transition-all"><Share2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                        );
                      })}
                 </div>
               )}
            </div>
          ) : currentView === 'logs' ? (
            <div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col">
               <div className={\`flex-1 flex flex-col rounded-[0.8rem] border overflow-hidden \${theme === 'dark' ? 'bg-[#0a0a0f] border-neutral-800' : 'bg-black border-neutral-800'}\`}>
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-800 bg-black/50">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                     </div>
                     <span className="text-[10px] font-mono opacity-40 ml-4 font-black tracking-widest uppercase">System Flux Monitor.sh — {logs.length} events</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 font-mono text-[13px] leading-relaxed custom-scrollbar bg-black/20 selection:bg-emerald-500/30">
                     {logs.length > 0 ? (
                       <div className="space-y-3">
                         {logs.map((log, i) => (
                           <div key={i} className="flex gap-6 group">
                              <span className="text-emerald-500/40 shrink-0 select-none">[{log.ts}]</span>
                              <span className="text-emerald-400 break-all">
                                 <span className="opacity-30 mr-3">➜</span>
                                 {log.message}
                              </span>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="h-full flex items-center justify-center opacity-10">
                          <Shield className="w-20 h-20" />
                       </div>
                     )}
                  </div>
               </div>
            </div>
          ) : null}
        </div>
`;

content = content.replace(mainHeaderRegex, replacementMain + '</main>');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx COMPREHENSIVE FIX applied');
