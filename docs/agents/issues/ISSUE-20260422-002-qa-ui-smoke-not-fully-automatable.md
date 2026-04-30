# ISSUE-20260422-002 — QA UI smoke not fully automatable

| Field | Value |
|--------|--------|
| **Issue ID** | ISSUE-20260422-002 |
| **Discovered** | 2026-04-22 |
| **Severity** | P2 |
| **Status** | Open |
| **Reported by** | QA-01 |

## Problem description

Task `TASK-20260421-007` requires end-to-end UI validation of dashboard menu actions, patient/staff flows, and assignment drag/drop.  
Current project setup has no automated UI test harness (for example, Playwright/Electron E2E scripts) to execute those scenarios non-interactively in this QA session.

## Reproduction steps

1. Start app in dev mode using `start-dev.bat`.
2. Confirm runtime services are up (`http://localhost:5173/` responds, Electron process is present).
3. Attempt to execute required UI acceptance matrix items through non-interactive terminal/API-only checks.
4. Observe that task-critical UI interactions (menu clicks, drag/drop, print flow, manual assignment operations) cannot be validated with evidence output in this mode.

## Expected result

QA should be able to execute and capture deterministic evidence for all required UI functional checks in `TASK-20260421-007`.

## Actual result

Only runtime-level health checks are currently verifiable via terminal evidence.  
Full UI functional matrix cannot be completed in this automation-only pass.

## Impact scope

- Blocks complete evidence-based closure of `TASK-20260421-007`.
- Increases release risk because required UI regression paths are not fully validated in this pass.

## Suggested fix

Add a minimal Electron UI smoke harness that can automate:
- login flow
- dashboard/menu navigation
- key patient/staff actions
- assignment drag/drop + save verification
