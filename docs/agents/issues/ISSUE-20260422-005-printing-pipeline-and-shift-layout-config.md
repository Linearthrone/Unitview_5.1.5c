---
issue_id: ISSUE-20260422-005
found_at: 2026-04-22
severity: P1
status: Open
reported_by: User
owner: PM-01
---

# Printing pipeline issues + missing shift-assignment print layout GUI

## Problem summary

1. Current print function appears unreliable / incorrect in behavior.
2. Shift assignment print output is hardcoded and not user-configurable.
3. User needs a GUI to define:
   - what data fields appear,
   - where each field appears,
   - and in what order.

## Current architectural gap

- Print output currently depends on fixed HTML template generation and CSS rules.
- No persisted user print-layout configuration model exists.
- No print-layout editor workflow exists.

## Expected outcome

- Stable print behavior for both charge and assignment reports.
- A print-layout configuration GUI for shift assignments.
- Saved per-layout or per-unit print template presets with preview and apply.
