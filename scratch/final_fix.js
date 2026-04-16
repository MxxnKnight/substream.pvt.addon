const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix missing import
content = content.replace(/ExternalLink/g, 'ExternalLink, Share2');

// 2. Fix height and margin for Logs
// Remove the parent padding for logs view so the panel can fill the area cleanly
content = content.replace(/<div className="max-w-full mx-auto w-full p-4 lg:p-10 pt-4 lg:pt-6 pb-20 flex flex-col flex-1 gap-4">/g,
`<div className={\`max-w-full mx-auto w-full flex flex-col flex-1 \${currentView === 'logs' ? 'p-0 h-full overflow-hidden' : 'p-4 lg:p-6 pb-20 gap-4'}\`}>`);

// Adjust the logs container to fill 100% height when in logs view
content = content.replace(/<div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col pb-10">/g,
'<div className="flex-1 w-full animate-in fade-in duration-700 flex flex-col h-full">');

// Ensure the border container in logs fills the area
content = content.replace(/rounded-\[0\.8rem\] border overflow-hidden/g, 
'rounded-none lg:rounded-[1rem] border-x-0 lg:border-x border-y shadow-2xl h-full flex flex-col');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Share2 import & Height Fix applied');
