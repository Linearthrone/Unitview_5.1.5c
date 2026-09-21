---
type: proposal
status: sent-to-pm
tt_id: TT-01
prop_id: PROP-3-clinical-command-surface
created: 2026-09-21
updated: 2026-09-21
title: Clinical command surface
need: Make UnitView look like the future of healthcare — professional, engaging, and calm — without turning the unit board into a consumer app or a new spreadsheet.
sent_at: 2026-09-21
pm_intake: docs/agents/tasks/PROP-3-TT01-to-PM01.md
---

# Clinical command surface

## 1. Need / Want

Kurt wants a full UI redesign. UnitView should look like the future of healthcare: professional, engaging, and pleasing to look at. It should not feel like dated spreadsheet manipulation.

## 2. Goal & Success Criteria

A charge nurse recognizes the unit on day one, can still drag a room onto a nurse, and can print the charge sheet without a tour. The board no longer reads as a 2018 admin grid (Arial, double borders, equal stat chips, icon salad).

Success is both of these, and the first one kills the work if it fails:

1. **Safety glance.** Isolation subtype, fall risk, DNR, restraints, and name alerts are readable with no hover, on the workstation and in black-and-white print. Color is never the only channel.
2. **Calm command surface.** Occupied-and-assigned rooms are quiet and full contrast. Unassigned or unsafe rooms are the only cells that speak. Facility branding leads; UnitView is the tool name, not a stethoscope hero.
3. **Same job.** The 17×10 map, stable room positions, drag-and-drop, census contents, admit/discharge dialogs, Spectra, and both print targets stay. WALLDISPLAY hides patient identifiers only (not clinical quick-reference fields).
4. **No storage program.** No vault rewrite, no SQLite, no React/Vite/Tailwind major upgrade, no split of `unit-view-client.tsx` in this wave.

## 3. Context & Constraints

- Product is UnitView `5.1.5-c` (Electron, React 18, Vite, Tailwind, shadcn). Not House Victoria.
- Local-first PHI. HIPAA source of truth: `docs/HIPAA_AND_EPIC_FHIR.md`. Renderer must not become the long-term PHI owner.
- April 2026 UI checklist (`docs/agents/ui-review/TASK-20260422-013-UI-DECISION-CHECKLIST.md`) kept almost every control, asked for a clinical-dark login, a facility logo slot, better contrast, and roles including WALLDISPLAY. It also conflicts with itself on five named themes versus light + clinical-dark only, and on 18px Arial versus a denser heading scale.
- Visual debt today:
  - `renderer/src/globals.css` owns shadcn HSL tokens, Arial at 18px, and print (white, ~10pt, `.print-hide`).
  - `renderer/src/themes.css` is a second RGB theme system (`theme-light|dark|blue|green|purple`) plus `* { transition: … !important }` on every node. Settings already tell users the extra themes are deprecated, but the store still types five `global_theme` values.
  - The unit board often never receives Tailwind’s `dark` class, so `dark:` utilities and `themes.css` overrides disagree. That mismatch is a large part of the dated look.
  - Clinical meaning is hardcoded Tailwind hues in `patient-block.tsx` and `app-header.tsx`. Fall risk, seizure, aspiration, and isolation can share one accent. Some alerts are icon-only with a tooltip, which is why an icon-legend dialog exists. Assigned patients render at about 70% opacity, so the staffed unit is the dimmest view.
  - Header census is a wrap of equal bordered chips. Wallpaper snapshot already uses the failure mode (gradients, hairline borders, tiny type), not the target.
- Playwright smoke (`renderer/smoke/qa-smoke.spec.ts`) keys off login labels, unit select, Print → Charge report, the oncoming-shift control, and `[data-patient-id]` drag. There is no screenshot gate.
- PROP-1 (persist honesty) and PROP-2 (in-memory transitions) are merged. Do not couple this to storage.
- Create Unit already authors the spatial map (rows/cols + card placement). That authoring stays for PROP-3.

## 3.1 Visual mockups (exploratory)

Concept art only — not shipped UI. Files under `docs/agents/unexecuted_proposals/mockups/clinical-command-surface/`.

| File | What it shows |
| --- | --- |
| `mockup-01-today-spreadsheet-board.png` | Contrast: today’s equal chips + icon-row cards |
| `mockup-02b-option-a-same-map-workstation.png` | **A (this PROP):** same map (rooms + nurse cards together), new chrome |
| `mockup-05-option-a-light.png` | **A** light mode |
| `mockup-03-option-a-wall.png` | **A** wall: no patient names; admit/EDD and safety marks kept |
| `mockup-02-option-a-workstation.png` | Draft — drifted to a nurse sidebar; superseded by `02b` |
| `mockup-04-option-b-new-layout.png` | **B (later PROP):** nurse columns + abstract floorplan |

## 4. Clarifying Q&A (answered)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Board structure | **Ship Option A now** (same map, new look). Option B later as an optional alternate unit view selectable by facility type/size (product label TBD: e.g. “classic style” / “traditional view”). Kurt, 2026-09-21. |
| 2 | Wall content | Hide **patient identifiers only**; keep clinical quick-reference (including admit/EDD). |
| 3 | Typeface | **Keep** Arial at 18px. |
| 4 | Wall idle lock | **No idle lock** for WALLDISPLAY. Nurse workstations still lock. |
| 5 | Floorplan authoring for B | **Admin-only at facility setup** (nurses do not author). Admin draws the unit layout and places rooms initially. Prefer richer authoring than today’s grid if needed for B’s map aesthetic. Not in PROP-3. |
| 6 | Why B later | Kurt likes B’s **map + card** look for marketing and wall-map aesthetics. Ships as optional alternate view after A; label TBD. |

## 5. Avenues Explored

Seats: STRAT, CONTRA, SYS, RISK, USER (+ light pass on floorplan authoring). No seat edited product code.

**STRAT.** Ship skin + same-grid expression first. New layout is a second program.

**CONTRA.** Kill glass/motion/icon-only safety. Do not add a third token system.

**SYS.** Unify `themes.css` into `globals.css` first. Card skin on the same map is the win. Do not split `unit-view-client.tsx`. Print stays white.

**RISK.** Wall: hide identifiers only; no idle lock; no CDNs; 18px floor.

**USER.** Same map, two distances; labeled safety marks; stop fading assigned rooms.

### Conflicts resolved for PROP-3

| Topic | Resolution |
| --- | --- |
| A vs B | **A ships in PROP-3.** B parked as a later optional view mode by facility type/size. |
| Floorplan authoring | Out of PROP-3. Documented for the follow-on PROP (reuse Create Unit). |
| Themes | Light + clinical-dark only. |
| Type | Arial 18px. |

### Avenue A — Same map, new look (**this PROP**)

Tokens + card/header expression + wall privacy/chrome. Same Create Unit grid and drag targets.

### Avenue B — Alternate view (parked follow-on PROP)

Nurse columns + abstract floorplan / map + card style. Kurt wants this for **marketing eye-catch** and **wall-map aesthetics**, offered later by facility type/size (label TBD: “classic style” / “traditional view”).

**Authoring (locked intent):**

- **Who:** Facility admin during setup — **not** charge nurses on shift.
- **What:** Admin **draws the unit layout** and **places rooms** initially. Nurses only use the live board afterward.
- **Authoring avenues when that PROP opens:** revisit B-auth-1 (render Create Unit grid) vs B-auth-2 (corridor templates / paint) vs a constrained draw-and-place editor. Cloud CAD / third-party uploads stay out. Local underlay (B-auth-4) only if product still needs true footprint after a draw editor.

PROP-3 must not implement B. Document only.

### Avenue C — Staged program name

C1 foundation + C2 expression = PROP-3. C3 facility-home polish only if C2 still feels dated. B is **not** C3 — B is a separate later PROP.

## 6. Recommended Route

**Ship Option A as PROP-3.** Calm clinical command surface on the existing room map.

**Locked product decisions** (Kurt, 2026-09-21):

- **Board (PROP-3):** Option A — same map, new look. Keep the cell map, drag-and-drop, context menus, Spectra, both print targets. Do not change stored `gridRow` / `gridColumn` semantics.
- **Follow-on (not PROP-3):** Option B as optional alternate view by facility type/size for marketing and wall aesthetics; product label TBD. **Admin draws layout + places rooms at setup; nurses do not author.** Floorplan authoring details are a later TT/PM pass (draw editor vs templates vs Create Unit render).
- **Type:** Arial at 18px. Wall room numbers may be larger.
- **Wall PHI:** Hide patient identifiers only. Keep clinical quick-reference including admit/EDD. Name-alert *strings* with patient names stay off the wall.
- **Wall idle lock:** WALLDISPLAY does not idle-lock. Workstations still lock. Clear PHI on explicit logout / switch-user. Print/export off wall role.

**Visual defaults:**

- Light + clinical-dark only.
- Assigned rooms full contrast + settled mark (no opacity-as-done).
- Safety: shape + short text; contact / airborne / droplet distinct; clinical hues not folded into `--primary`.
- No glass, blur, gradient washes, remote assets, patient photos, pulsing alerts. Honor `prefers-reduced-motion`.
- Audit stays admin-visible; no PHI in new toasts/tooltips.

**First ship:** C1 foundation + C2 workstation expression. Wall chrome after SEC privacy + no-idle-lock.

## 7. Alternatives (parked)

- **Option B alternate view** — later PROP; admin draw-and-place at setup; marketing + wall aesthetics; facility type/size opt-in; label TBD.
- **Consumer-health visual language** — rejected for PROP-3 execution (B wall may be more expressive later without glass/PHI risk).
- **Cloud CAD floorplan authoring** — out; local admin draw editor is the B path to explore later.
- **Big-bang dialog / shift-maker / wallpaper / print restyle** — after the board, not inside PROP-3.

## 8. Risks & Kill Criteria

Kill or stop a slice when:

- Isolation subtype, fall risk, DNR, restraints, or name alerts become icon-only, color-only, or tooltip-only.
- Body/muted text below WCAG AA or body size below 18px.
- Glass, blur, translucency, or gradient washes on cards/census/name-alert banner.
- Motion on room cards, or the global `!important` transition kept.
- Density drops so the full unit is no longer the primary view; census collapsed by default.
- Third token system; vault rewrite; React/Tailwind major bump; split of `unit-view-client.tsx`.
- WALLDISPLAY shows person-identifying fields or mounts name-bearing print DOM / tooltips.
- Smoke cannot sign in, enter a unit, open charge report, or drag `[data-patient-id]`.

## 9. Open Questions for User / PM

None blocking PROP-3.

Deferred to the Option B follow-on PROP:

1. Product label: “classic style” vs “traditional view” (or other).
2. Admin draw tool: freehand/corridor-paint on a canvas vs enhanced Create Unit grid — enough to get the B map aesthetic without CAD.
3. Floorplan on the live board: glance-only vs drag-on-map for nurses (authoring remains admin-only either way).
4. Whether wall/marketing B mode can share the same placements as the A command surface for one facility.

## 10. Suggested PM Handoff

- `prop_id`: **PROP-3-clinical-command-surface**
- Intake: `docs/agents/tasks/PROP-3-TT01-to-PM01.md`
- Suggested splits (hints; TINA may re-divide):
  - `PROP-3.1` — **FED-01** — One token source; retire `themes.css` overrides + global transition; print white / ~10pt / `.print-hide`; Arial 18px. No vault redesign.
  - `PROP-3.2` — **FED-01** — Same-grid workstation expression: cards, grouped census, no assigned fade, labeled safety marks. Preserve smoke selectors and drag nodes. No `gridRow`/`gridColumn` semantic change.
  - `PROP-3.3` — **SEC-01** — WALLDISPLAY: hide identifiers only; keep clinical quick-ref; disable idle lock for wall only; no name leak via print DOM/tooltips.
  - `PROP-3.4` — **FED-01** — Wall chrome after 3.3.
  - `PROP-3.5` — **QA-01** — Smoke + contrast/safety-glance; wall identifiers off; wall does not idle-lock.
- **Do not** ticket Option B / floorplan alternate view under PROP-3. Park as a future PROP after A ships.
- What PM should decide first: accept Avenue A route and ticket 3.1 → 3.2; fan 3.3 when capacity allows.
