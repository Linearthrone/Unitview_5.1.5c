# PROP-2.1 — PM-01 → FED-01 (in-memory transitions)

**From:** TINA (PM-01)
**To:** FED-01
**Proposal:** PROP-2
**Product root:** `/workspace`

## Do

`renderer/src/components/unit-view-client.tsx`:

- Remove `window.location.href = '/'` from import, save-as, create-unit, and layout select.
- Load the target layout in memory (patients, nurses, techs, oncoming, spectra, layout list).
- `availableLayouts` must be stateful so save-as / create-unit can append without reload.
- Do not autosave the previous unit over the new one (keep skip-first-autosave).
- After import, if the current layout is gone, open the first remaining layout or return to dashboard.

## Do not

SQLite. FHIR rewrite. Split `UnitViewClient`.

## Done

Those four flows stay on the board. Session and vault stay intact.
