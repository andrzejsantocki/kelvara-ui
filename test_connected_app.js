const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('app.html','utf8');
const js=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
function testShell(){for(const label of ['Overview','Positions','Safeguards','Protection','Account'])assert(html.includes(`>${label}<`),`missing ${label}`);assert(html.includes('connected-workspace'));assert(html.includes('workspace-nav'));}
function testRoutes(){for(const route of ['#overview','#positions','#safeguards','#protection','#account'])assert(js.includes(route)||html.includes(route),`missing ${route}`);assert(js.includes('hashchange'));}
function testTruthfulCopy(){assert(!html.includes('Fast evacuation is not armed'));assert(!html.includes('Prepare protection transaction'));assert(js.includes('Exit protection is not prepared'));}
function testResponsive(){assert(css.includes('.workspace-nav'));assert(css.includes('@media(max-width:720px)'));assert(css.includes('workspace-drawer'));}
testShell();testRoutes();testTruthfulCopy();testResponsive();console.log('connected app contract: 4 passed');
