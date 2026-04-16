const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const mobileThemeSection = `
                         <div className={\`pt-4 mt-4 border-t \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'} space-y-4\`}>
                           <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] font-black uppercase opacity-40">Appearance</span>
                              <div className="flex gap-2">
                                 {Object.keys(ACCENTS).map(c => (
                                    <button key={c} onClick={() => setAccent(c)} className={\`w-6 h-6 rounded-full \${ACCENTS[c].main} \${accent === c ? 'ring-2 ring-offset-2 ring-white' : 'opacity-30'}\`} />
                                 ))}
                              </div>
                           </div>
                           <div className="flex items-center justify-between px-2">
                              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={\`p-3 flex-1 flex items-center justify-center gap-3 rounded-2xl transition-all \${theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900 font-bold'}\`}>
                                 {theme === 'dark' ? <><Sun className="w-4 h-4 text-amber-500" /> Light Mode</> : <><Moon className="w-4 h-4 text-indigo-600" /> Dark Mode</>}
                              </button>
                           </div>
                           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 opacity-40 text-[10px] uppercase font-black py-2"><LogOut className="w-4 h-4" /> Sign Out</button>
                         </div>`;

content = content.replace(/<div className={\`pt-4 mt-4 border-t \${theme === 'dark' \? 'border-neutral-800' : 'border-neutral-200'} flex items-center justify-between px-6 pb-2\`>[\s\S]+?<\/div>/, mobileThemeSection);

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Mobile Accent Picker Added');
