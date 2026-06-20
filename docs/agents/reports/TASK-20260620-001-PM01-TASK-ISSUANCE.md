---
type: report
from: PM-01
to: DEV-01, ALL
status: Task Issuance
date: 2026-06-20
version: 5.1.5-c
---

# PM Task Issuance — 2026-06-20

## Context

User directive: **"you should be sending these to dev"** — open session work must be routed as formal DEV tasks under `docs/agents/tasks/`, not handled only via inline chat coding.

## Tasks issued

| Task ID | Priority | Summary |
|---------|----------|---------|
| [TASK-20260620-001](../tasks/TASK-20260620-001-PM01-to-DEV01.md) | P1 | Facility profile + logo branding, light-theme inputs, ReportSheet staff assignments, prior-shift snapshot wiring |
| [TASK-20260620-002](../tasks/TASK-20260620-002-PM01-to-DEV01.md) | P0 | Fix `wall` / `wall123` WALLDISPLAY login on stale localStorage (auth seed migration) |
| [TASK-20260620-003](../tasks/TASK-20260620-003-PM01-to-DEV01.md) | P2 | Verify + QA session UX items (Spectra collapse, map stretch, admin routing, nurse card fixes) — fix only if broken |

## Execution order (DEV-01)

1. **002** — unblocks wall-display demo (P0)
2. **001** — facility branding + prior-shift persistence (P1)
3. **003** — verification pass (P2, parallel OK after 001/002 unless shared files conflict)

## Coordination with prior sprint

These tasks **supplement** (do not replace) active lanes in `TASK-20260430-002`:

- `TASK-20260422-022` (print pipeline)
- `TASK-20260422-013` / `TASK-20260430-008` (UI redesign completion)
- `TASK-20260430-005` (contrast — coordinate with 20260620-001)

Partial renderer code for 001 may exist untracked — DEV must audit before implementing.

## PM next actions

- Await DEV completion reports: `TASK-20260620-{001,002,003}-DEV01-to-PM01.md`
- Queue QA validation after DEV reports accepted
- Update sprint snapshot when 002 + 001 are green
