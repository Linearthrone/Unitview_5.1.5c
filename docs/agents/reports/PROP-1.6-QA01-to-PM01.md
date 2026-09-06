# PROP-1.6 — QA-01 → PM-01

**Status:** done (static + unit tests; Electron UI not launched in this sandbox)

## Checks

| Case | Result |
| --- | --- |
| First-run (no vault) | `decideVaultInit({ success: true, data: null, exists: false })` → `first-run`. `initialize()` applies defaults only then, then one awaited save. |
| Existing vault decrypt/parse fail | Decision `blocked`. `StoreUnavailableError`. No `saveVault`, no seed. App maps this to login + banner. |
| Board autosave | `handleAutoSave` calls `saveBoardSnapshot` once; 150ms debounce; first paint skipped. |
| Docs/About | README / INSTALLATION / BUILD / About / DBD-01 describe `phi.vault.json`, not SQLite. |
| Unit tests | `npm test` — 21 passed, including vault-init + atomic-write. |
| Typecheck | `tsc -p tsconfig.main.json` and renderer `tsc` clean after excluding the vault-init test from the renderer program. |

## Not run here

Full Electron session (create vault, corrupt file, confirm bytes unchanged in `%APPDATA%`). That still needs a workstation pass.

## Verdict

PROP-1 persist contract holds in code and unit tests. No product edits from QA.
