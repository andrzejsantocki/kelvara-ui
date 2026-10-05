const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('app.html','utf8'),js=fs.readFileSync('app.js','utf8');
assert(html.includes('class="position-tabs hidden"'),'position detail tabs must start hidden');
assert(html.includes('id="position-list"'),'positions route needs a discoverable list container');
assert(js.includes('position-tabs')&&js.includes('classList.toggle("hidden",!Boolean(p))'),'tabs must follow selected position state');
assert(js.includes('workspaceRoutes[location.hash.slice(1)]'),'route handling must isolate shell panes');
console.log('persistent shell architecture contract: passed');
