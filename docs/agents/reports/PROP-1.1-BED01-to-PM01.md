# PROP-1.1 — BED-01 → PM-01

**Status:** done

## Changes

- `vaultExists()` on `src/ipc/secure-vault.ts`.
- `saveVault` uses `writeFileAtomicRestricted` (temp + replace).
- `secure-store-load` returns `{ success, data, exists, error? }`.
- `renderer/src/electron-api.d.ts` updated.
- Unit test: `src/ipc/atomic-write.test.ts`.

## Evidence

Decrypt/parse throw still fails the handler; `exists` is computed before decrypt so a corrupt file reports `exists: true`.
