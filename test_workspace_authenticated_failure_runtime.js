const assert=require('assert'),fs=require('fs');
const source=fs.readFileSync('app.js','utf8');
const authenticated=/if\(!sessionContinuationCurrent\(generation\)\)return;setWorkspaceVisible\(true\);bindServiceRetries\(\);/;
assert.match(source,authenticated,'authenticated workspace must appear before optional health/portfolio loading');
const inspectReveal=/await inspect\(\);if\(sessionContinuationCurrent\(generation\)\)setWorkspaceVisible\(true\)/;
assert.doesNotMatch(source,inspectReveal,'workspace visibility must not depend on successful portfolio rendering');
console.log('authenticated workspace survives portfolio failure');
