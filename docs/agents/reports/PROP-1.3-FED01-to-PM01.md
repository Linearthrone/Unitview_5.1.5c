# PROP-1.3 + 1.4 + 1.5 — FED-01 → PM-01

**Status:** done

## 1.3

- `getPatients` seeds North-South only on empty + store available (no `catch` seed).
- `savePatients` / nurse+tech saves throw and await flush.
- Layout/nurse/spectra reads no longer invent `['North-South View']` or `[]` on store error.
- Decrypt fail: `App` stays on login (`AuthContainer` + banner). No fatal trap. Vault not written.

## 1.4

- Board autosave is one `saveBoardSnapshot` after a 150ms coalesce.
- First paint skipped so load does not immediately rewrite the vault.

## 1.5

- README, INSTALLATION, BUILD_INSTRUCTIONS, About box, DBD-01 / AGENTS live claims: vault, `npm run electron` / `npm run dev`, version 5.1.5-c.
