import assert from 'node:assert/strict';
import {
  NETWORKS,
  normalizeNetwork,
  requireNetwork,
  networkMatches,
  switchNetwork,
} from './network-identity.mjs';

assert.deepEqual(NETWORKS, ['mainnet-beta', 'devnet']);
assert.equal(normalizeNetwork('mainnet-beta'), 'mainnet-beta');
assert.equal(normalizeNetwork('devnet'), 'devnet');
for (const value of [undefined, null, '', 'Mainnet', 'testnet', 'mainnet']) {
  assert.equal(normalizeNetwork(value), null, `unknown network accepted: ${value}`);
  assert.throws(() => requireNetwork(value), /invalid_network/);
}
assert.equal(networkMatches('mainnet-beta', 'mainnet-beta'), true);
assert.equal(networkMatches('mainnet-beta', 'devnet'), false);
assert.equal(networkMatches(undefined, 'mainnet-beta'), false);
assert.deepEqual(switchNetwork('mainnet-beta', 'devnet', { wallet: 'w', token: 't' }), {
  network: 'devnet',
  state: {},
});
assert.throws(() => switchNetwork('mainnet-beta', 'unknown', { wallet: 'w' }), /invalid_network/);
assert.throws(() => switchNetwork('mainnet-beta', 'devnet', null), /network_state_required/);
console.log('network identity tests passed: closed values, fail-closed matching, state clearing');
