# Network Isolation Implementation Plan

Status: **Production UX clarified; selector remains behind the implementation gates.**

## Final production UX contract

- Before wallet connection, production presents an explicit **Mainnet / Devnet** mode choice. No wallet connection, discovery, or protected action occurs until a mode is selected.
- The selected mode is the session's authoritative network context. Backend authentication, RPC configuration, genesis verification, API requests, portfolio data, protocols, positions, safeguards, signing, protection, and exit actions must all use that same network.
- After selection and successful backend/RPC genesis verification, the UI persistently labels the active realm **Mainnet** or **Devnet**. The label remains visible through refresh, reconnect, account change, and navigation.
- Devnet is a fully separate realm containing only Devnet protocols, positions, safeguards, and actions. Mainnet likewise shows only Mainnet data and actions. Same-wallet, same-address, and same-token identifiers never cross the boundary.
- A Solana wallet public key/provider generally does not expose a trustworthy current cluster. The UI must not infer network from wallet metadata or claim automatic wallet-based detection. The user selection is explicit; backend/RPC genesis verification binds that selection to the wallet session.
- Missing, unknown, mismatched, unverified, or stale network/genesis data fails closed. Switching mode clears wallet-scoped state before discovery; a new session must re-verify the selected network.
- **Current repository slice:** the selector is not exposed yet; existing production handoff/session remains stamped `mainnet-beta`; no Devnet discovery is claimed.

## Vertical phases and gates

1. **UI identity harness — current slice.** Closed identity module; tests for normalization, required session/handoff network, mismatch restoration, state clearing. Existing handoff/session remains `mainnet-beta`. Gate: focused harness plus all UI scripts green; selector remains hidden; no Devnet RPC.
2. **Explicit pre-connect network UX.** Add Mainnet/Devnet selection before wallet connection. Persist the selected mode and render the persistent realm label. Acceptance: no wallet/provider/API/discovery work before selection; refresh, reconnect, account change, and navigation retain the selected label; changing mode clears wallet state. Gate: browser journey tests.
3. **Genesis/session binding.** Verify the selected network against the configured RPC genesis fingerprint, then bind both network and verified genesis to the wallet session. Acceptance: wallet metadata never supplies network truth; wrong endpoint, changed genesis, timeout, malformed response, or stale binding blocks session creation and protected calls. Gate: authenticated HTTP/RPC tests.
4. **Production Program Backend request boundary.** Require network and verified binding on auth challenge/verify, portfolio, inspect, protection, and evacuation routes. Acceptance: missing/unknown/mismatched network returns fail-closed 400/401; a mainnet token cannot replay on Devnet; serialized route fixtures include network/genesis binding.
5. **Portfolio/source isolation.** Scope source registry, protocols, positions, safeguards, observations, and actions by network. Acceptance: identical wallet/token IDs across networks never merge; empty network returns empty/unknown, not another network's data; cross-network filtering/rejection is enforced at the backend boundary.
6. **Canonical IDs.** Prefix or tuple all asset, vault, token-account, program, authority, position, receipt, and idempotency IDs with network. Acceptance: same raw address on both networks yields distinct IDs; cross-network references reject.
7. **Persistence/migration.** Add network columns/constraints/indexes; backfill legacy rows as `mainnet-beta` only with audit marker; reject ambiguous rows. Acceptance: migration preserves counts, separates identical IDs across networks, and is idempotent.
8. **Protection/exit safety boundary.** Bind permits, nonce accounts, simulation, signatures, and submission to network and verified genesis. Acceptance: mismatch, stale guard, altered network, or cross-network receipt produces zero signing/broadcast calls.
9. **Migration/observability.** Add metrics, audit events, operator backfill, rollback/runbook. Unresolved rows block activation.
10. **Release/mobile QA.** Verify cache/versioning, mobile wallet handoff, deep links, offline restore, persistent realm label, and no selector leakage before release. Acceptance: Devnet never appears in Mainnet realm; wrong cluster cannot arm/exit; clean archive and browser/mobile matrix pass.

## Contract test acceptance

`test_network_isolation_plan.mjs` must prove the committed plan states:

- explicit Mainnet/Devnet selection before wallet connection;
- persistent Mainnet/Devnet realm labeling;
- selected-network and verified-genesis wallet-session binding;
- same-network filtering and cross-network rejection;
- separate protocols/positions/safeguards/actions per realm;
- no trustworthy cluster inference from wallet public keys/providers;
- selector not exposed in the current slice.

## TDD evidence

RED: `test_network_identity.mjs` initially failed with `ERR_MODULE_NOT_FOUND` because `network-identity.mjs` did not exist. GREEN: same test passed after the minimal module implementation. The documentation contract test is intentionally run RED against the prior plan, then GREEN after this clarification.

## Deployment gates

No backend, HAOS, RPC, migration, or production deployment work is included in this documentation slice. Push is the only release action. Do not claim the selector, Devnet discovery, or production multi-network readiness until phases 2–10 and release QA pass.
