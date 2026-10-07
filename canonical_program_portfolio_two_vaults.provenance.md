# Canonical Program Backend fixture provenance

- Producer repository: `/home/andy/COLLOSEUM KELVARA/kelvara_program`
- Producer commit: `1c84ff1`
- Contract source: `test/canonical-portfolio-route.test.js`, canonical two-target manifest and `createPortfolioOrchestrator` normalization.
- Generation: executed the real producer `createPortfolioOrchestrator(...).getPortfolio(wallet)` with the exact two canonical targets and adapter-shaped details; serialized with `JSON.stringify(..., null, 2)`.
- Fixture SHA-256: `19225af4e566d45dcc338d40dc465022c5421234af5281f9e8b3f644217db0f3`
- No Control Plane static token is present in the fixture or browser test.
