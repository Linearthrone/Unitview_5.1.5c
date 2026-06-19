---
issue_id: ISSUE-20260430-004
found_at: 2026-04-30
severity: P1
status: Open
reported_by: User
owner: PM-01
related_task: TASK-20260430-007
---

# Unassigned staff cards need prominent Assign Staff Member action

## User request

On staff cards **without an assigned staff member**, show a **"+ Assign staff member"** button that assigns a person to that card and the **shift responsibilities** represented by that card (role, patient slots, spectra, etc.).

## Current gap

- Charge Nurse / Unit Clerk / PCT cards partially support assign when name is `Unassigned`.
- Staff Nurse cards may show placeholder names (`New Staff Nurse`) that are not treated as unassigned.
- Label inconsistency (`+ Assign staff` vs user-requested `+ Assign staff member`).
- Assign flow may open generic add-staff instead of **assign-to-this-card** context.

## Expected

- Visible primary action on every unassigned staff card type.
- Assign dialog scoped to the card's role and responsibilities for the shift.
