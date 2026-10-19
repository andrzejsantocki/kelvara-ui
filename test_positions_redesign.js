const fs=require('fs'); const html=fs.readFileSync('app.html','utf8'); const css=fs.readFileSync('styles.css','utf8'); const app=fs.readFileSync('app.js','utf8');
function has(s){if(!s) throw new Error('missing');}
if(!html.includes('position-icon')) throw new Error('position icon missing');
if(!html.includes('Safeguards informational')) throw new Error('truthful badge missing');
if(!css.includes('.position-card-icon')) throw new Error('card icon styles missing');
if(!app.includes('protocolIconFor')) throw new Error('central protocol icon registry missing');
if(app.includes("protocol.includes('steak')")) throw new Error('inline protocol icon mapping remains');
const registry=fs.readFileSync('assets/protocols/registry.js','utf8');
if(!registry.includes('./kamino.svg')) throw new Error('Kamino protocol icon missing');
if(!registry.includes('./steakhouse.svg')) throw new Error('Steakhouse protocol icon missing');
if(!app.includes('if(empty)empty.classList.toggle("hidden",positions.length>0)')) throw new Error('portfolio renderer must terminate eligible-position loading state');
if(/if\(row\)row\.classList/.test(app)) throw new Error('removed position-row reference still aborts selection');
console.log('positions redesign contract ok');
