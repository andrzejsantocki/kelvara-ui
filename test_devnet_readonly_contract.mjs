import assert from 'node:assert/strict';
import test from 'node:test';
import { DEVNET_GENESIS, validateDevnetPortfolio, validateDevnetInspect, projectDevnetView, devnetRequest } from './devnet-readonly.mjs';

const WALLET = 'Wallet111';
const INSPECT = { network: 'devnet', genesisHash: DEVNET_GENESIS, wallet: WALLET, position: null, authority: null, sourceStatus: 'canonical_devnet_empty_read_only' };

const EMPTY = { network: 'devnet', genesisHash: DEVNET_GENESIS, sourceStatus: 'canonical_devnet_empty_read_only', positions: [], safeguards: [], protocolStatuses: [] };

test('accepts the exact backend canonical empty Devnet portfolio wire response', () => {
  assert.deepEqual(validateDevnetPortfolio(JSON.parse(JSON.stringify(EMPTY))), EMPTY);
});
test('rejects wrong network, genesis, extra, or non-empty portfolio data', () => {
  for (const bad of [
    { ...EMPTY, network: 'mainnet-beta' },
    { ...EMPTY, genesisHash: 'wrong' },
    { ...EMPTY, extra: true },
    { ...EMPTY, positions: [{}] },
  ]) assert.throws(() => validateDevnetPortfolio(bad));
});
test('accepts exact canonical empty Devnet inspect response and rejects drift', () => {
  assert.deepEqual(validateDevnetInspect(WALLET, JSON.parse(JSON.stringify(INSPECT))), INSPECT);
  for (const bad of [{ ...INSPECT, network: 'mainnet-beta' }, { ...INSPECT, wallet: 'Other' }, { ...INSPECT, position: {} }, { ...INSPECT, extra: true }]) assert.throws(() => validateDevnetInspect(WALLET, bad));
});

test('projects read-only Devnet labels and disabled capabilities', () => {
  assert.deepEqual(projectDevnetView(EMPTY), { networkLabel: 'Devnet', positionLabel: '0 positions', emptyLabel: 'No Devnet positions', accessLabel: 'Read-only', capabilities: { protect: false, evacuate: false, sign: false } });
});
test('requires a real bounded bearer token for portfolio request metadata', () => {
  assert.throws(() => devnetRequest('Wallet111'));
  assert.throws(() => devnetRequest('Wallet111', ''));
  assert.throws(() => devnetRequest('Wallet111', 'x'.repeat(4097)));
  assert.throws(() => devnetRequest('', 'token'));
  assert.deepEqual(devnetRequest('Wallet111', 'token'), { path: '/api/portfolio/Wallet111', headers: { authorization: 'Bearer token', 'x-kelvara-network': 'devnet', 'x-kelvara-genesis': DEVNET_GENESIS } });
});
