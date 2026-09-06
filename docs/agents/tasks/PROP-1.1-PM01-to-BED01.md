# PROP-1.1 — PM-01 → BED-01 (vault fail-closed + exists)

**From:** TINA (PM-01)
**To:** BED-01
**Proposal:** PROP-1
**Product root:** `/workspace`

## Accept

Encrypted vault stays SoT. Decrypt/parse failure must not write.

## Do

1. `src/ipc/secure-vault.ts`: export `vaultExists()`. `saveVault` write temp file then `renameSync` onto `phi.vault.json`.
2. `src/ipc/register-handlers.ts` `secure-store-load`: always include `exists: vaultExists()`. On decrypt throw: `{ success: false, exists: true, error }`. Missing file: `{ success: true, data: null, exists: false }`.
3. Update `renderer/src/electron-api.d.ts` `loadSecureStore` return type.

## Do not

SQLite. Weaken sandbox. Change FHIR.

## Done

Load can distinguish first-run vs blocked vault. Save is atomic.
