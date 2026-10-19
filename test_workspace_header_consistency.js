const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('app.html','utf8'),css=fs.readFileSync('styles.css','utf8');
assert(html.includes('<small>Eligible portfolio balance</small>'),'eligible balance label missing');
assert(!html.includes('<small>Total token balance</small>'),'old balance label remains');
for(const pane of ['overview','positions','governance','safeguards','protection','account']){
 const section=html.match(new RegExp(`<section class="workspace-pane[^"]*" id="pane-${pane}">([\\s\\S]*?)(?=<section class="workspace-pane|$)`));
 assert(section,`missing pane ${pane}`);
 assert.match(section[1],/^<header class="workspace-pane-header">[\s\S]*?<\/header>/,`${pane} needs common header wrapper`);
}
assert.match(css,/\.workspace-pane-header\{[^}]*min-height:[^;}]+[^}]*\}/,'common static header height missing');
assert.match(css,/\.workspace-pane-header h1\{[^}]*font-size:[^;}]+[^}]*\}/,'common heading size missing');
console.log('workspace header consistency: ok');
