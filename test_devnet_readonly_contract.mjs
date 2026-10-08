import assert from 'node:assert/strict';
import test from 'node:test';
import { DEVNET_GENESIS, validateDevnetPortfolio, projectDevnetView, devnetRequest } from './devnet-readonly.mjs';

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
test('projects read-only Devnet labels and disabled capabilities', () => {
  assert.deepEqual(projectDevnetView(EMPTY), { networkLabel: 'Devnet', positionLabel: '0 positions', emptyLabel: 'No Devnet positions', accessLabel: 'Read-only', capabilities: { protect: false, evacuate: false, sign: false } });
});
test('builds network and genesis bound portfolio request metadata', () => {
  assert.deepEqual(devnetRequest('Wallet111'), { path: '/api/portfolio/Wallet111', headers: { authorization: 'Bearer TOKEN', 'x-kelvara-network': 'devnet', 'x-kelvara-genesis': DEVNET_GENESIS } });
});
