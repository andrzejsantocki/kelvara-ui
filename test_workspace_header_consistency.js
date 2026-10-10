const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('app.html','utf8'),css=fs.readFileSync('styles.css','utf8');
assert(html.includes('<small>Eligible portfolio balance</small>'),'eligible balance label missing');
assert(!html.includes('<small>Total token balance</small>'),'old balance label remains');
for(const pane of ['overview','positions','governance','safeguards','protection','account']){
 const section=html.match(new RegExp(`<section class="workspace-pane[^"]*" id="pane-${pane}">([\\s\\S]*?)(?=<section class="workspace-pane|$)`));
 assert(section,`missing pane ${pane}`);
 assert.match(section[1],/^<header class="page-header">[\s\S]*?<\/header>/,`${pane} needs shared PageHeader structure`);
 assert.match(section[1],/^<header class="page-header"><span class="page-header__eyebrow">[^<]+<\/span><h1(?: id="[^"]+")? class="page-header__title">[^<]+<\/h1><p(?: id="[^"]+")? class="page-header__description">[^<]+<\/p><\/header>/,`${pane} header geometry must use shared elements`);
}
for(const contract of [/\.page-header\{[^}]*margin:0 0 40px[^}]*\}/,/\.page-header__eyebrow\{[^}]*font:700 12px[^}]*letter-spacing:\.12em[^}]*\}/,/\.page-header__title\{[^}]*font-size:52px[^}]*font-weight:500[^}]*\}/,/\.page-header__description\{[^}]*font-size:17px[^}]*\}/,/\.page-header\+\*\{[^}]*margin-top:0!important[^}]*\}/])assert.match(css,contract,'shared PageHeader CSS contract missing');
for(const forbidden of [/#pane-positions h1/,/#pane-(?:overview|positions|governance|safeguards|protection|account)>p/,/\.workspace-pane h1/,/\.workspace-pane>p/,/workspace-pane-header/])assert.doesNotMatch(css,forbidden,'per-page/legacy header styling remains');
console.log('shared PageHeader consistency: ok');
