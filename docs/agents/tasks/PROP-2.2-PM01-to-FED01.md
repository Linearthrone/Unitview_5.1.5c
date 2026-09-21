# PROP-2.2 — PM-01 → FED-01 (delete-only leftovers)

**From:** TINA (PM-01)
**To:** FED-01
**Proposal:** PROP-2

## Do

Delete files that are unimported and excluded from the live renderer program:

- Root twins under `renderer/src/*.tsx` that duplicate `components/`
- `App-auth.tsx`, `database-debug.ts`, `debug-storage.ts`, `lib/database-auth.ts`
- Unused `renderer/src/ui/` (live primitives are `components/ui/`)
- `types/better-sqlite3.d.ts`, unused `hooks/use-autosave.ts`, unused `components/unit-dashboard.tsx`

Update `renderer/tsconfig.json` excludes to match remaining files.

## Do not

Merge leftover trees onto live components. Do not delete `components/` copies.

## Done

`main.tsx` → `App.tsx` → `components/` still typechecks. No import of a deleted file.
