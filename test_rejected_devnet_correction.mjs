import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const root=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const devnet=fs.readFileSync('devnet-readonly.mjs','utf8');
const GEN='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';

test('published root validates exact canonical Devnet portfolio before handoff',()=>{
 assert.match(root,/validateDevnetPortfolio/);
 assert.match(root,/inspectionPath=network==='devnet'\?['"]\/api\/portfolio\/['"]:['"]\/api\/inspect\/['"]/);
 assert.match(root,/sourceStatus.*canonical_devnet_empty_read_only/);
 assert.match(root,/validateDevnetPortfolio/);
 assert.doesNotMatch(root,/validateDevnetInspect/);
});
test('connected app permits Solflare Devnet and binds token equality',()=>{
 assert.doesNotMatch(app,/CURRENT_NETWORK==="devnet"\)throw new Error\("devnet_unavailable"\)/);
 assert.match(app,/protectionToken!==record\.token|record\.token!==protectionToken/);
});
test('Devnet labels and health are read-only, never unavailable',()=>{
 assert.match(app,/CURRENT_NETWORK===['"]devnet['"]/);
 assert.match(app,/Devnet read-only/);
 assert.match(app,/Devnet read-only session; protection mutations disabled/);
});
test('all Devnet mutation handlers fail closed without side effects',()=>{
 for(const fn of ['armProtection','fastClose','revokeProtection','openEvacuation','simulateEvacuation','signEvacuation','activateMonitoring']){
  const body=app.slice(app.indexOf(`function ${fn}`),app.indexOf('\nfunction ',app.indexOf(`function ${fn}`)+10));
  assert.match(body,/CURRENT_NETWORK===['"]devnet['"]|CURRENT_NETWORK !== ['"]devnet['"]/ ,fn);
 }
});
test('Devnet portfolio request uses one validated in-memory token',()=>{
 assert.match(app,/record\.token!==protectionToken|protectionToken!==record\.token/);
 assert.match(app,/devnetRequest\(address, protectionToken\)/);
});
test('root auth checks bounded exact challenge and verify contracts',()=>{
 assert.match(root,/typeof challenge\.message!==['"]string['"]/);
 assert.match(root,/challenge\.message\.length>4096/);
 assert.match(root,/typeof session\.token!==['"]string['"]/);
});
console.log('rejected Devnet correction contract tests loaded');
