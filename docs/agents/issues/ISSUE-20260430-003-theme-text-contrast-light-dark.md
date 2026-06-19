---
issue_id: ISSUE-20260430-003
found_at: 2026-04-30
severity: P2
status: Open
reported_by: User
owner: PM-01
---

# Text contrast too low against backgrounds in light and dark themes

## User request

Increase contrast between text and background in **both** light and dark themes — especially muted/secondary labels on cards, headers, and unit map chrome.

## Scope

- Theme tokens in `renderer/src/globals.css` (and any overrides in shared UI).
- Verify readability on dashboard, unit header, patient cards, dialogs.

## Acceptance

- Body and muted text clearly readable in light and dark without harsh/neon styling.
- No functional regressions.
