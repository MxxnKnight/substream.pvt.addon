const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Clear ANY remaining shadow occurrences (including custom ones)
content = content.replace(/shadow-\[0_0_50px_rgba\(0,0,0,0\.5\)\]/g, '');
content = content.replace(/shadow-sm/g, '');
content = content.replace(/shadow-lg/g, '');
content = content.replace(/shadow-md/g, '');
content = content.replace(/shadow-xl/g, '');

// 2. Expand width to fill available space
content = content.replace(/max-w-\[1400px\]/g, 'max-w-full');
content = content.replace(/max-w-screen-2xl/g, 'max-w-full');

// 3. Reduce gaps to make things "fit" better
content = content.replace(/gap-8/g, 'gap-4'); // Reduced gap in containers
content = content.replace(/p-4 lg:p-8/g, 'p-4 lg:p-4'); // Reduced padding

// 4. Ensure the dropdown nav looks like it's expanding exactly from the header line
// (I already did sticky top-0 and border-b in the previous script).

// 5. Final check on dark mode background (black)
content = content.replace(/bg-neutral-900/g, 'bg-black'); 

// Actually, let's keep some subtle differentiation for cards
content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-[1rem]'); // Less rounded, more modern/square-ish premium
content = content.replace(/rounded-\[2rem\]/g, 'rounded-[0.8rem]'); 
content = content.replace(/rounded-\[1\.8rem\]/g, 'rounded-[0.8rem]');

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx Flat Premium Design Applied');
