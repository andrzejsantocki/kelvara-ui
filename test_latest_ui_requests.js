const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('app.html','utf8'),app=fs.readFileSync('app.js','utf8'),landing=fs.readFileSync('index.html','utf8');
assert(!html.includes('id="workspace-network"'));
assert(!html.includes('id="workspace-wallet"'));
assert(app.includes('protocolIconFor(mapped.brand,mapped.name)'));
assert(app.includes('positionIcon.src=protocolIconFor(mapped.brand,mapped.name)'));
assert(!app.includes('from Kamino and Solana'));
assert(landing.includes('id="connect-wallet"'));
console.log('latest UI requests contract ok');
