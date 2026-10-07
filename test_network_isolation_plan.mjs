import assert from 'node:assert/strict';
import fs from 'node:fs';

const plan = fs.readFileSync(new URL('./docs/NETWORK_ISOLATION_IMPLEMENTATION_PLAN.md', import.meta.url), 'utf8');

assert.match(plan, /Before wallet connection.*explicit.*Mainnet.*Devnet.*mode choice/is);
assert.match(plan, /persistently labels.*Mainnet.*Devnet/is);
assert.match(plan, /bind.*network.*verified genesis.*wallet session/is);
assert.match(plan, /same-network filtering.*cross-network rejection/is);
assert.match(plan, /separate realm.*Devnet protocols.*positions.*safeguards.*actions/is);
assert.match(plan, /wallet public key\/provider.*not.*trustworthy.*current cluster/is);
assert.match(plan, /must not infer network from wallet metadata|no automatic wallet-based detection/is);
assert.match(plan, /selector is not exposed yet/is);

console.log('network isolation plan contract passed: explicit pre-connect mode, persistent label, verified session binding, same-network isolation, no wallet inference');
