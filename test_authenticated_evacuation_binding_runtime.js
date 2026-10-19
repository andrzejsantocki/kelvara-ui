const assert=require('assert'),fs=require('fs');
const source=fs.readFileSync('app.js','utf8');
function body(name,next){const start=source.indexOf(`async function ${name}`);assert(start>=0,`${name} exists`);const end=source.indexOf(`\nasync function ${next}`,start);return source.slice(start,end<0?undefined:end)}
const simulate=body('simulateEvacuation','signEvacuation'),sign=body('signEvacuation','revokeProtection'),wait=source.slice(source.indexOf('async function waitForConfirmation'),source.indexOf('\ndocument.querySelectorAll'));
assert(/post\("\/api\/evacuation\/prepare",\{wallet:walletAddress,shares:evidence\.position\.totalShares,priorityFeeCap:Number\(\$\("#priority-fee"\)\.value\),network:CURRENT_NETWORK\},true\)/.test(simulate),'prepare authenticated exact binding');
assert(/post\("\/api\/evacuation\/submit",\{wallet:walletAddress,signedTransaction,network:CURRENT_NETWORK\},true\)/.test(sign),'submit authenticated exact binding');
for(const route of ['/api/protection/nonce-setup/prepare','/api/protection/nonce-setup/submit','/api/protection/prepare','/api/protection/arm','/api/protection/fast-close','/api/protection/revoke/prepare','/api/protection/revoke','/api/protection/revoke/finalize','/api/protection/manual-evacuation/finalize']) assert(source.includes(`\"${route}\"`)||source.includes(`'${route}'`)||source.includes('`'+route),`protected route retained: ${route}`);
assert(/function post\(path,body,authenticated=false\).*authenticated[\s\S]*network/.test(source),'authenticated POST body includes selected network');
assert(/request\(`\/api\/evacuation\/status\/\$\{signature\}`\)/.test(wait),'status polling uses authenticated request');
assert(/sessionBinding\(\)/.test(source),'authenticated calls require session binding');
assert(/catch\(error\).*evacuation-message/s.test(sign),'auth or binding failure prevents broadcast completion');
assert(!/signTransaction\([^)]*\).*fetch\([^)]*evacuation\/submit/s.test(sign),'submit cannot broadcast before authenticated request');
console.log('authenticated evacuation binding runtime passed: prepare, submit, status exact binding and fail-closed auth path');
