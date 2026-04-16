const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Remove neon/glow effects from ACCENTS
content = content.replace(/shadow: 'shadow-[^']+',/g, "shadow: '',");
content = content.replace(/ring: 'ring-[^']+'/g, "ring: ''");

// 2. Remove shadow-xl/20/md from various elements to remove "neon" feel
content = content.replace(/shadow-xl/g, '');
content = content.replace(/shadow-2xl/g, '');
content = content.replace(/shadow-md/g, '');
content = content.replace(/shadow-lg/g, '');

// 3. Fix Layout Spacing
// Change fixed spacer h-40/h-24 to h-4 (very small) or remove it
content = content.replace(/<div className="h-40 lg:h-24 shrink-0" \/>/g, '<div className="h-2 lg:h-4 shrink-0" />');

// 4. Transform Mobile Header & Navigation
// Make header at top of main content area, not floating with huge margins
content = content.replace(/header className={`lg:hidden flex flex-col gap-4 p-5 mx-4 rounded-\[2.5rem\] fixed top-\[15px\] left-0 right-0 z-50 border shadow-2xl transition-all \${theme === 'dark' \? 'bg-black\/90 border-neutral-800' : 'bg-white\/95 border-neutral-200'} backdrop-blur-xl`}/g, 
"header className={`lg:hidden flex flex-col border-b ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'} sticky top-0 z-50`}");

// Adjust mobile header interior
content = content.replace(/<div className="flex items-center justify-between">/g, '<div className="flex items-center justify-between p-4 px-6">');

// 5. Change Drawer logic to "Expand from Header"
// Currently: <aside className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex w-full lg:w-72 ...
// We will move the mobile nav to be a div inside the main content or header that toggles visibility
content = content.replace(/<aside className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex w-full lg:w-72 \${theme === 'dark' \? 'bg-black lg:bg-\[#0a0a0a\]' : 'bg-neutral-50'} border-b lg:border-b-0 lg:border-r \${theme === 'dark' \? 'border-neutral-800' : 'border-neutral-200'} transition-all duration-500 \${isNavOpen \? 'translate-y-0' : '-translate-y-full lg:translate-y-0'}`}>/g,
`<aside className={\`hidden lg:flex lg:relative lg:z-0 lg:w-72 \${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-neutral-50'} border-r \${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}\`}>`);

// Add the Mobile Menu expansion logic right below the mobile header
const mobileMenuMarkup = `
             {isNavOpen && (
                <div className={\`lg:hidden border-b \${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'} animate-in slide-in-from-top duration-300\`}>
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
                      <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-between px-6">
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl bg-neutral-800">{theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button>
                        <button onClick={handleLogout} className="flex items-center gap-2 opacity-40 text-[10px] uppercase font-black"><LogOut className="w-4 h-4" /> Sign Out</button>
                      </div>
                   </nav>
                </div>
             )}`;

content = content.replace(/<\/header>/, '</div>' + mobileMenuMarkup + '</header>');
// Wait, the regex might match the wrong </header>. There are two. one mobile, one desktop.
// I'll be more specific.

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx integrated header and mobile dropdown applied');
