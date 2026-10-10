const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('app.js','utf8'), html=fs.readFileSync('app.html','utf8'), index=fs.readFileSync('index.html','utf8');
assert(fs.existsSync('assets/tokens/registry.js')); assert(fs.existsSync('assets/networks/registry.js')); assert(fs.existsSync('assets/custom/registry.js'));
assert(app.includes('tokenIconFor') && app.includes('networkIconFor'));
assert(!html.includes('/assets/kamino.svg')); assert(html.includes('/assets/custom/fallback.svg')); assert(app.includes('customIconFor'));
assert(!index.includes('7626559')&&!index.includes('overview-real-mapping'));
console.log('icon system and cache handoff regressions: ok');
