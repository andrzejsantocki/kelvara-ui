const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('app.js','utf8');
const renderer=source.slice(source.indexOf('function renderGroupedSafeguards'),source.indexOf('async function loadGroupedSafeguards'));
assert(!/summary\.onclick\s*=/.test(renderer),'group summary must use native <details> expansion without a second manual toggle');
assert(/safeguardNode\('details'/.test(renderer),'group remains a native details element');
assert(/safeguardNode\('summary'/.test(renderer),'group remains a native summary control');
console.log('safeguard group native expansion passed');
