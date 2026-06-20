---
issue_id: ISSUE-20260620-001
found_at: 2026-06-20
severity: P0
status: Open
reported_by: QA-01
owner: PM-01
related_task: TASK-20260422-012
parent_issue: ISSUE-20260422-001-unit-isolation-and-room-dnd.md
---

# North-South seed still duplicates right-column rooms 812–816

## Summary

QA code-level verification of `TASK-20260422-012` found that `TASK-20260422-011` removed duplicate bed **811** from the top row, but beds **812–816** remain seeded in both the top row and the right column of `seedNorthSouthLayout()`.

## Evidence

File: `renderer/src/services/patientService.ts` — `seedNorthSouthLayout()`

- Top row (`topRowRoomOrder`): includes 812, 813, 814, 815, 816 at row 1.
- Right column loop: creates 811–816 at column 17, rows 2–7.

Duplicate patient IDs produced:

- `patient-ns-812` through `patient-ns-816` (each appears twice in the seeded array)

Static analysis (2026-06-20):

```text
Right-column bed numbers also on top row: [816, 815, 814, 813, 812]
Duplicate patient ids: patient-ns-812 … patient-ns-816
```

## Impact

1. **Duplicate room rendering** — row 1 and right column both display cards for beds 812–816.
2. **Right-column drag broken** — `handleDropOnCell` resolves by patient ID; duplicate IDs cause wrong-card updates.
3. **Regression risk** — same root-cause class as the original `811` defect; fix appears partial.

## Expected behavior

Each bed number appears once in the North-South seed map. Right-column rooms 811–816 must not also appear on the top row.

## Suggested fix

Adjust `topRowRoomOrder` to remove 812–816 (use `null` placeholders like the 811 fix) so bed numbers and `patient-ns-{n}` IDs are unique across the layout seed. The right-column loop (`811 + i` for `i` 0..5) should remain the only source for rooms 811–816.

## QA reference

- Report: `docs/agents/reports/TASK-20260422-012-QA01-to-PM01.md`
- Parent: `ISSUE-20260422-001-unit-isolation-and-room-dnd.md` (partial closure only — 811 + delete scoping)