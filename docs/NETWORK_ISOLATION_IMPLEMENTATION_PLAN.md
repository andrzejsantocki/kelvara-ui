# Network Isolation Implementation Plan

Status: **Phase 1 harness slice complete; mainnet-only runtime remains unchanged.**

## Contract

- Closed network IDs: `mainnet-beta`, `devnet`; no aliases, inference, or empty defaults.
- Every session, landing handoff, API request context, portfolio record, canonical ID, and protection/exit action carries one network ID.
- Unknown, missing, mismatched, or unverified network data fails closed.
- Switching networks clears wallet-scoped state before any new discovery.
- This UI slice stamps the existing production landing handoff/session `mainnet-beta`; it does not expose a selector or perform devnet discovery.

## Vertical phases and gates

1. **UI identity harness — current slice.** Add closed identity module; RED tests for normalization, required session/handoff network, mismatch restoration, and state clearing; GREEN integration stamps current landing handoff/session with `mainnet-beta`. Gate: focused harness plus all UI scripts green; no selector; no devnet RPC.
2. **Production Program Backend request boundary.** Require network on auth challenge/verify, portfolio, inspect, protection, and evacuation routes. Bind token claims to network. Acceptance: missing/unknown/mismatched network returns fail-closed 400/401; same wallet cannot replay a mainnet token on devnet; serialized route fixtures include network. Gate: backend focused/full suites and authenticated HTTP tests.
3. **Auth/session lifecycle.** Persist network in signed session claims and handoffs; validate on refresh, account change, logout, expiry, and cross-tab restore. Acceptance: every malformed/missing/mismatch case deletes session and performs no protected call; exact-network replay only. Gate: restart/refresh browser tests.
4. **Portfolio/source isolation.** Scope source registry, positions, safeguards, and observations by network. Acceptance: identical wallet/token IDs across networks never merge; empty network returns empty/unknown, not another network's data. Gate: persistence and projection tests.
5. **Canonical IDs.** Prefix or tuple all asset, vault, token-account, program, authority, position, receipt, and idempotency IDs with network. Acceptance: same raw address on both networks yields distinct IDs; cross-network references reject. Gate: producer/consumer serialized parity tests.
6. **RPC genesis guard.** Resolve configured endpoint, fetch genesis hash, compare expected network fingerprint before reads/writes. Acceptance: wrong endpoint, changed genesis, timeout, malformed response fail closed; no portfolio/protection/exit RPC follows guard failure. Gate: mocked RPC and live staging endpoint checks.
7. **Persistence/migration.** Add network columns/constraints/indexes; backfill legacy rows as `mainnet-beta` only with audit marker; reject ambiguous rows. Acceptance: migration preserves counts, rejects duplicates across same network, separates identical IDs across networks, is idempotent. Gate: populated and malformed stamped-schema tests.
8. **Protection/exit safety boundary.** Bind permits, nonce accounts, simulation, signatures, and submission to network/genesis/cluster. Acceptance: network mismatch, stale guard, altered network, or cross-network receipt produces zero signing/broadcast calls. Gate: real route + zero-effect adversarial tests.
9. **Migration/observability.** Add metrics, audit events, operator backfill, rollback/runbook. Acceptance: every legacy conversion traceable; unresolved rows block activation. Gate: dry-run counts and rollback rehearsal.
10. **Release/mobile QA.** Deploy separate config/hosts, verify cache/versioning, mobile wallet handoff, deep links, offline restore, and no selector leakage. Acceptance: mobile refresh and handoff preserve exact network; devnet never appears in mainnet UI; wrong cluster cannot arm/exit. Gate: clean archive, browser/mobile matrix, Pages smoke, backend health.

## Phase 1 exact acceptance tests

- `normalizeNetwork` accepts exactly the two IDs; rejects missing, aliases, and unknown values.
- `requireNetwork` throws `invalid_network` for missing/unknown values.
- session/handoff fixtures include `network`; missing or mismatch is discarded before provider/API use.
- restoring a mainnet wallet with a devnet record fails closed; cross-network comparison is false.
- switching network returns an empty wallet-scoped state object.
- production landing handoff and app session are stamped `mainnet-beta`.

## TDD evidence

RED: `test_network_identity.mjs` initially failed with `ERR_MODULE_NOT_FOUND` because `network-identity.mjs` did not exist. GREEN: same test passed after the minimal module implementation.

## Deployment gates

No backend, HAOS, RPC, migration, or production deployment work is included in this slice. Push is the only release action. Do not claim devnet discovery or network selection until phases 2–7 and release QA pass.
