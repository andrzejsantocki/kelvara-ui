const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('app.html','utf8'), js=fs.readFileSync('app.js','utf8');
assert(html.includes('id="position-card"')&&html.includes('id="position-list"'));
for(const id of ['position-name','position-protocol','position-network','position-token','amount','position-total-shares','position-staked-shares','position-unstaked-shares','position-vault','position-program','position-activity','position-protection']) assert(html.includes(`id="${id}"`),`missing ${id}`);
assert(js.includes('position-card')&&js.includes('position-tabs'));
console.log('positions slice contract passed');
