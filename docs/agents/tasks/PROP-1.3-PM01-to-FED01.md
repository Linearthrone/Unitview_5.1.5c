# PROP-1.3 + 1.4 — PM-01 → FED-01

**From:** TINA (PM-01)
**To:** FED-01
**Proposal:** PROP-1
**Product root:** `/workspace`

## Do

1. `patientService.ts`: seed North-South **only** when store initialized, available, and patients truly empty. **Never** seed in `catch`. `savePatients` must throw on failure.
2. `layoutService.ts` / `nurseService.ts`: on store error do not invent `['North-South View']` or `[]` silently in a way that later persists. Surface unavailable.
3. `App.tsx`: `StoreUnavailableError` → stay on **login / AuthContainer** with a banner. Not the full-page fatal trap. Do not persist defaults.
4. `unit-view-client.tsx`: coalesce board autosave to **one** write of latest `this.data` / latest board snapshot. Do not fire four independent full-document saves per change. Do not autosave until vault initialized successfully.

## Done

Decrypt fail shows main screen + banner. Autosave is one write. No seed-on-error.
