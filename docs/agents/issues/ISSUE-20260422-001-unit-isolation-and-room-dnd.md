---
issue_id: ISSUE-20260422-001
found_at: 2026-04-22
severity: P0
status: Fix delivered — pending QA validation (TASK-20260422-012)
reported_by: User
owner: PM-01
---

# Unit isolation + room card drag defects

## Problem summary

Three high-impact defects were reported:

1. **All units appear linked to the same data view**
   - Entering different units shows the same state.
   - Editing one unit is reflected across all units.
   - This indicates a layout scoping or persistence key isolation failure.

2. **Right-column room cards do not move on drag**
   - Click/drag interaction does not move these cards.
   - Behavior is inconsistent with drag support elsewhere.

3. **Duplicate right-column room shown on first row**
   - A room card from the right column is duplicated on row one.
   - Likely render/data mapping duplication bug.

## Expected behavior

- Each unit/layout must be isolated by layout key and persist independently.
- All draggable room cards should move when layout is unlocked and drag target is valid.
- No duplicate room cards should render unless explicitly configured.

## Initial impact assessment

- Clinical assignment integrity risk across units (P0).
- Layout editing workflow blocked for affected room cards.
- Visual/data inconsistency in room map rendering.

