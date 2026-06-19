---
issue_id: ISSUE-20260430-002
found_at: 2026-04-30
severity: P2
status: Open
reported_by: User
owner: PM-01
related: ISSUE-20260422-003
---

# Unit map zoom should use +/- controls and default to full-unit view

## User request

1. Replace wheel-only zoom UX with **plus/minus buttons** using a **magnifying-glass** idiom (e.g. ZoomIn/ZoomOut icons).
2. **Default zoom on each unit** should show the **entire unit** (fit-to-view), not fixed 100%.
3. Clicking the percentage label should reset to fit-to-view.

## Notes

Partial implementation may exist in working tree from ad-hoc edits — DEV should review, finish, and normalize through proper task/report flow.

## Likely files

- `renderer/src/components/patient-grid.tsx`
