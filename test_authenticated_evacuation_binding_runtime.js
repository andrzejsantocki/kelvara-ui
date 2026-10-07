const assert=require('assert'),fs=require('fs');
const source=fs.readFileSync('app.js','utf8');
function body(name,next){const start=source.indexOf(`async function ${name}`);assert(start>=0,`${name} exists`);const end=source.indexOf(`\nasync function ${next}`,start);return source.slice(start,end<0?undefined:end)}
const simulate=body('simulateEvacuation','signEvacuation'),sign=body('signEvacuation','revokeProtection'),wait=source.slice(source.indexOf('async function waitForConfirmation'),source.indexOf('\ndocument.querySelectorAll'));
assert(/post\("\/api\/evacuation\/prepare",\{wallet:walletAddress,shares:evidence\.position\.totalShares,priorityFeeCap:Number\(\$\("#priority-fee"\)\.value\)\},true\)/.test(simulate),'prepare authenticated exact binding');
assert(/post\("\/api\/evacuation\/submit",\{wallet:walletAddress,signedTransaction\},true\)/.test(sign),'submit authenticated exact binding');
assert(/request\(`\/api\/evacuation\/status\/\$\{signature\}`\)/.test(wait),'status polling uses authenticated request');
assert(/sessionBinding\(\)/.test(source),'authenticated calls require session binding');
assert(/catch\(error\).*evacuation-message/s.test(sign),'auth or binding failure prevents broadcast completion');
assert(!/signTransaction\([^)]*\).*fetch\([^)]*evacuation\/submit/s.test(sign),'submit cannot broadcast before authenticated request');
console.log('authenticated evacuation binding runtime passed: prepare, submit, status exact binding and fail-closed auth path');
