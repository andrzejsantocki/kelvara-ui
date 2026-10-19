const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes("location.hostname==='app.kelvara.xyz'?'https://api.kelvara.xyz':''"),'landing must select production API only on the production hostname');
assert(html.includes("fetch(apiUrl('/healthz')"),'health must use the selected API base');
assert(html.includes("API=apiUrl('/api/supported-positions?network=')"),'position discovery must use the selected API base');
assert(!html.includes("fetch('https://api.kelvara.xyz/healthz'"),'local health must not bypass same-origin proxy');
console.log('local preview proxy contract passed');
