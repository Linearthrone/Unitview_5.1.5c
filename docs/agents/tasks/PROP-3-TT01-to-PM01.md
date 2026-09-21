---
type: proposal-intake
prop_id: PROP-3
prop_full: PROP-3-clinical-command-surface
from: TT-01
to: PM-01
priority: P0
status: Intake — waiting LinearThrone approval before TINA tickets
created: 2026-09-21
sent_at: 2026-09-21
mode: idea
title: Clinical command surface — same map, new look
proposal: docs/agents/unexecuted_proposals/clinical-command-surface.md
assignee_role: PM-01 (TINA)
---

# PROP-3 : Clinical command surface (TT-01 → TINA / PM-01)

**For:** PM-01 (TINA). **From:** TT-01. **Mode:** `idea`.  
**Proposal:** `docs/agents/unexecuted_proposals/clinical-command-surface.md`  
**Mockups:** `docs/agents/unexecuted_proposals/mockups/clinical-command-surface/`

LinearThrone directed: thinktank first; **he approves**; then TINA evaluates as PM and executes at her discretion. **Do not issue PROP-3.M until he approves.**

## One-paragraph recommended route

Ship **Option A** now: same Create Unit room map and drag-and-drop, new clinical command-surface look (unify tokens, restyle cards/header, labeled safety marks, stop fading assigned rooms, wall hides patient identifiers only and does not idle-lock). Keep Arial 18px. Do **not** replace the board with a floorplan layout in this PROP. **Option B** (nurse columns + abstract floorplan) is a **later optional view** selectable by facility type/size — product label TBD (“classic style” / “traditional view”); authoring should reuse Create Unit placements, not CAD.

## Seat dissent

CONTRA would stop at tokens-only if the acceptance test is a prettier screenshot; USER and Kurt require card/header expression. Structure stays A (CONTRA/STRAT/SYS). B is deferred, not rejected forever.

## Suggested next tickets (not binding; hold for approval)

| Split | Role | One-line |
| --- | --- | --- |
| PROP-3.1 | FED-01 | Unify theme tokens; kill `themes.css` overrides + global transition; print stays white |
| PROP-3.2 | FED-01 | Same-grid card + census expression; no assigned-room fade; labeled safety marks |
| PROP-3.3 | SEC-01 | WALLDISPLAY: identifiers off; clinical quick-ref on; no idle lock |
| PROP-3.4 | FED-01 | Wall chrome after 3.3 |
| PROP-3.5 | QA-01 | Smoke + contrast/safety-glance; wall privacy + no idle-lock |

## Open questions still needing LinearThrone / PM

None blocking PROP-3. Deferred to the Option B follow-on: view label, glance-only vs drag-on-map, corridor templates.

## Explicit non-goals for PROP-3

- Option B / floorplan alternate view
- Vault / SQLite rewrite
- Splitting `unit-view-client.tsx`
- React or Tailwind major upgrades
- Font CDNs, glass, pulsing alerts

TT-01 does not ticket FED/BED/SEC/QA.
