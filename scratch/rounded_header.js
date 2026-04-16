const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Mobile Header: Rounded Capsule
const mobileHeaderStart = /header className={`lg:hidden flex flex-col border-b[^`]*sticky top-0 z-50`}/;
const mobileHeaderReplacement = "header className={`lg:hidden flex flex-col fixed top-3 left-3 right-3 z-50 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-black/90 border-neutral-800' : 'bg-white/95 border-neutral-200'} backdrop-blur-xl shadow-lg`}";
content = content.replace(mobileHeaderStart, mobileHeaderReplacement);

// 2. Desktop Header: Rounded Capsule
const desktopHeaderStart = /header className={`hidden lg:flex items-center justify-between sticky top-0 z-50 py-4 px-8 border-b transition-all \${theme === 'dark' \? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'} backdrop-blur-xl`}/;
const desktopHeaderReplacement = "header className={`hidden lg:flex items-center justify-between fixed top-4 left-4 lg:left-[calc(288px+1.5rem)] right-4 z-50 py-4 px-8 border rounded-full transition-all ${theme === 'dark' ? 'bg-black/80 border-neutral-800' : 'bg-white/80 border-neutral-200'} backdrop-blur-xl shadow-md`}";
content = content.replace(desktopHeaderStart, desktopHeaderReplacement);

// 3. Spacing: Add a controlled spacer
// Removing the previous sticky behavior and adding a pt-24 spacer
content = content.replace(/<div className="max-w-full mx-auto w-full p-4 lg:p-4 flex flex-col flex-1 gap-4">/g, 
"<div className=\"max-w-full mx-auto w-full p-4 lg:p-4 pt-24 lg:pt-24 flex flex-col flex-1 gap-4\">");

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Rounded Capsule Layout Applied');
