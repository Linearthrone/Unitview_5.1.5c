# PROP-1.1 — DBD-01 → PM-01

**Status:** done

## Changes

- `StoreUnavailableError` + `decideVaultInit` (`renderer/src/lib/vault-init.ts`).
- Existing vault decrypt/parse fail → throw; no defaults; no `saveVault`.
- Missing vault → first-run defaults, then one awaited write.
- `saveToLocalStorage` serializes through `writeChain` and awaits IPC in `flushVault`.
- `saveBoardSnapshot` writes the whole board in one document persist.

## Evidence

`renderer/src/lib/vault-init.test.ts` covers first-run vs blocked vs use.
