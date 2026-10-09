const fs=require('fs'); const html=fs.readFileSync('app.html','utf8'); const css=fs.readFileSync('styles.css','utf8'); const app=fs.readFileSync('app.js','utf8');
function has(s){if(!s) throw new Error('missing');}
if(!html.includes('position-icon')) throw new Error('position icon missing');
if(!html.includes('Safeguards informational')) throw new Error('truthful badge missing');
if(!css.includes('.position-card-icon')) throw new Error('card icon styles missing');
if(!app.includes('assets/kamino.svg')) throw new Error('protocol icon mapping missing');
if(!app.includes('assets/steakhouse-usdg.svg')) throw new Error('steakhouse icon mapping missing');
if(!app.includes('if(empty)empty.classList.toggle("hidden",positions.length>0)')) throw new Error('portfolio renderer must terminate eligible-position loading state');
if(/if\(row\)row\.classList/.test(app)) throw new Error('removed position-row reference still aborts selection');
console.log('positions redesign contract ok');
