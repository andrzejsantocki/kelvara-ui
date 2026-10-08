export const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const EMPTY_KEYS = ['network', 'genesisHash', 'sourceStatus', 'positions', 'safeguards', 'protocolStatuses'];

export function validateDevnetPortfolio(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('devnet_portfolio_invalid');
  if (Object.keys(value).sort().join(',') !== EMPTY_KEYS.slice().sort().join(',')) throw new TypeError('devnet_portfolio_shape_invalid');
  if (value.network !== 'devnet' || value.genesisHash !== DEVNET_GENESIS || value.sourceStatus !== 'canonical_devnet_empty_read_only') throw new TypeError('devnet_portfolio_binding_invalid');
  for (const field of ['positions', 'safeguards', 'protocolStatuses']) if (!Array.isArray(value[field]) || value[field].length !== 0) throw new TypeError('devnet_portfolio_not_empty');
  return value;
}

export function projectDevnetView(portfolio) {
  validateDevnetPortfolio(portfolio);
  return { networkLabel: 'Devnet', positionLabel: '0 positions', emptyLabel: 'No Devnet positions', accessLabel: 'Read-only', capabilities: { protect: false, evacuate: false, sign: false } };
}

export function devnetRequest(wallet, token) {
  if (typeof wallet !== 'string' || !wallet || wallet.length > 64) throw new TypeError('wallet_required');
  if (typeof token !== 'string' || !token || token.length > 4096) throw new TypeError('token_required');
  return { path: `/api/portfolio/${encodeURIComponent(wallet)}`, headers: { authorization: `Bearer ${token}`, 'x-kelvara-network': 'devnet', 'x-kelvara-genesis': DEVNET_GENESIS } };
}
