# PROP-1.1 — PM-01 → DBD-01 (initialize fail-closed)

**From:** TINA (PM-01)
**To:** DBD-01
**Proposal:** PROP-1
**Product root:** `/workspace`

## Do

`renderer/src/lib/database-simple.ts`:

- Export `StoreUnavailableError`.
- `initialize()`:
  - vault **missing** → first-run defaults + save (OK).
  - vault **exists** + decrypt/parse fail → throw `StoreUnavailableError`. **No** `initializeWithDefaults`, **no** `saveVault`, **no** localStorage fallback write.
  - vault **exists** + parse OK → use it.
- `saveToLocalStorage` must **await** IPC and throw if `success === false`. Serialize writes (queue / lock) so overlapping saves cannot clobber.

## Done

Existing vault is never overwritten on open failure. Saves are awaited.
