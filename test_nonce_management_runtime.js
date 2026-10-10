const assert=require('assert'),fs=require('fs');
const html=fs.readFileSync('app.html','utf8'),js=fs.readFileSync('app.js','utf8');
assert(!html.includes('Nonce management'),'nonce engineering term must stay out of default UI');
assert(js.includes('protectionStatus.revocationRequired'),'releasable backend state required');
assert(js.includes('protectionStatus.variants'),'in-use backend state required');
assert(js.includes("mode:'releasable'")&&js.includes("mode:'active'"),'in-use and releasable states must remain distinct');
assert(js.includes('revokeProtection()')||js.includes('onclick=revokeProtection'),'signed revocation workflow must remain wired');
console.log('protection resource lifecycle contract passed');
