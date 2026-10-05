const assert=require('assert'),fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('app.html','utf8'),src=fs.readFileSync('app.js','utf8');
assert(html.includes('id="portfolio-positions"'),'portfolio positions container missing');
assert(html.includes('id="portfolio-safeguards"'),'portfolio safeguards container missing');
assert(src.includes('function renderPortfolio'),'portfolio renderer missing');
assert(src.includes('/api/portfolio/'),'portfolio API missing');
assert(src.includes('missing receipt'),'missing receipt must remain unknown');
console.log('portfolio contract passed');
