const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('app.html','utf8'),js=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
for(const marker of ['stage-position','stage-authority','stage-monitor','Preview monitoring','MONITOR','Evacuation review','Simulate evacuation','Sign and evacuate','Healthy','Evidence current','1 detected','Just now','2 / 2']){assert(!html.includes(marker),`legacy marker: ${marker}`);}
for(const route of ['#overview','#positions','#safeguards','#protection','#account'])assert(html.includes(`href="${route}"`),`missing ${route}`);
for(const pane of ['pane-overview','pane-positions','pane-safeguards','pane-protection','pane-account'])assert(html.includes(`id="${pane}"`),`missing ${pane}`);
assert(html.includes('aria-label="Workspace"'));assert(html.includes('data-position-tab="overview"'));assert(html.includes('data-position-tab="safeguards"'));assert(html.includes('data-position-tab="activity"'));assert(html.includes('data-position-tab="protection"'));
assert(html.includes('Simulate exit'));assert(html.includes('Review and sign exit'));assert(html.includes('Exit protection'));assert(html.includes('Unknown'));assert(html.includes('Not loaded'));assert(css.includes('@media(max-width:720px)')||css.includes('@media (max-width: 720px)'));
assert(js.includes('hashchange'));assert(js.includes('data-position-tab'));console.log('connected app contract: passed');
