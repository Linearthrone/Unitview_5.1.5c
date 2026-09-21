---
type: proposal
status: unexecuted
tt_id: TT-01
created: 2026-09-21
updated: 2026-09-21
title: Clinical command surface
need: Make UnitView look like the future of healthcare — professional, engaging, and calm — without turning the unit board into a consumer app or a new spreadsheet.
sent_at:
pm_intake:
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
- Next free proposal number is **3**. It is **not reserved** until this proposal is sent to PM.

## 3.1 Visual mockups (exploratory)

Concept art only — not shipped UI. Files under `docs/agents/unexecuted_proposals/mockups/clinical-command-surface/`.

| File | What it shows |
| --- | --- |
| `mockup-01-today-spreadsheet-board.png` | Contrast: today’s equal chips + icon-row cards |
| `mockup-02b-option-a-same-map-workstation.png` | **A recommended:** same map (rooms + nurse cards together), new chrome |
| `mockup-05-option-a-light.png` | **A** light mode of the same idea |
| `mockup-03-option-a-wall.png` | **A** wall: no patient names; admit/EDD and safety marks kept |
| `mockup-02-option-a-workstation.png` | Draft — drifted to a nurse sidebar; superseded by `02b` |
| `mockup-04-option-b-new-layout.png` | **B:** nurse columns + abstract floorplan (higher risk) |

## 4. Clarifying Q&A (answered)

| # | Question | Answer (Kurt, 2026-09-21) |
| --- | --- | --- |
| 1 | Board structure — keep today’s room map vs invent a new layout | **A — Same map, new look.** Rooms stay in saved grid positions; drag-and-drop stays; redesign cards, colors, chrome, and header. Do not replace the board structure. |
| 2 | What the wall may show | Hide **patient identifiers only** (name, MRN, and anything that identifies the person). Keep the rest for quick reference before entering the room (safety marks, occupancy, admit/EDD dates, and other non-identifier clinical cues already on the card). |
| 3 | Typeface | **Keep** Arial at 18px. |
| 4 | Idle lock on WALLDISPLAY | **No idle lock at all** for wall sessions. Nurse workstations still lock. |

## 5. Avenues Explored

Seats: STRAT, CONTRA, SYS, RISK, USER. All five ran. No seat edited the repo.

### Seat summaries

**STRAT.** The board is already the product. April 2026 locked the layout. What looks dated is density and chrome, not missing features. Ship a skin, then restyle how the same grid reads, and only then consider a new shell.

**CONTRA.** “Future of healthcare” skins (glass, blur, motion, hidden density, icon-only meaning) fail charge nurses. Safety coding is already fragile. Kill a redesign whose acceptance test is a prettier screenshot. Do not add a third token system. Do not fade alerts further.

**SYS.** A token-only pass will not modernize the board, and a new grid metaphor is a different program (persisted `gridRow` / `gridColumn`, shift-maker, wallpaper, zoom). Prerequisite is one token source and removal of `themes.css` overrides. Card skin on the same map is the visual win. Print must not inherit screen dark tokens. Do not split `unit-view-client.tsx`.

**RISK.** Identifiers are a role flag, not a theme. WALLDISPLAY still shows admit and expected-discharge dates, and print trees can stay mounted with names. Freeze a wall allow-list before restyling the wall. No font CDNs, no telemetry, no patient photos, no pulsing alerts. Body type stays at least 18px. Honor `prefers-reduced-motion`.

**USER.** Two distances, one map. At about 3 meters: shape of the unit. At arm’s length: who is in the room and what is unsafe. Hover does not exist on a wall. Preserve the grid, room number as the largest text, drag, and print. Simplify borders, the icon row, the fade on assigned rooms, and the theme toy. Facility logo is the brand.

### Conflicts

| Topic | Disagreement | Resolution in §6 |
| --- | --- | --- |
| How “full” is full | Kurt’s words and USER want a redesign of the experience. CONTRA and STRAT say a new information architecture will fail day-one recognition and the April keep-list. | **Locked by Kurt:** Option A — same map, new look. Avenue B parked. |
| Arial | STRAT and CONTRA treat 18px Arial as a locked checklist vote. USER says the vote was for large readable type, not that face. | **Locked by Kurt:** keep Arial at 18px. |
| Themes | Checklist both keeps five themes and retires them. SYS says settings already collapsed to light and clinical-dark. | Ship light + clinical-dark only. Leave stored blue/green/purple values readable and unused. |
| Wall dates / PHI | RISK wanted admit/EDD off the wall. Kurt wants quick reference before entering the room. | **Locked by Kurt:** hide patient identifiers only; keep clinical quick-reference fields including admit/EDD. |
| Wall idle lock | RISK flagged idle lock as a product/security decision. | **Locked by Kurt:** WALLDISPLAY does not idle-lock. Nurse workstations still lock. |

### Avenue A — Token unification only

One HSL token set, light and clinical-dark. Delete `themes.css` utility overrides and the global `!important` transition. Map stored `global_theme` onto light versus `.dark` without a vault redesign.

- Changes look on login, dashboard, and shells that already use semantic classes.
- Does **not** fix the spreadsheet feeling on patient cards or the header chip ribbon.
- Low behavior risk. Right as slice 1, wrong as the whole answer.

### Avenue B — New board metaphor

Sidebar shell, floorplan or nurse-column layout, wall as its own product. Reopens April decisions, touches persisted coordinates, shift-maker, wallpaper, and drag. High chance of PHI regressions on WALLDISPLAY. Day-one recognition fails.

Parked. Only if Kurt explicitly reopens information architecture after Avenue C slice 2 still feels old.

### Avenue C — Clinical command surface (recommended)

Same map and same jobs. Three slices. The experience is redesigned; the structure is not.

1. **Foundation.** One token source. Kill the global transition. Lock print to white ~10pt so dark tokens cannot leak onto paper. AA contrast for body and muted text in both modes. Smoke + a printed charge sheet as the gate.
2. **Expression, same grid.** Restyle patient, nurse, charge, clerk, and tech cards without moving drag nodes or renaming controls the smoke test uses. Room number stays the largest text. Replace the icon footer with a few labeled safety marks (shape + text). Group header census into census, safety, and devices instead of one equal chip ribbon. Stop fading assigned rooms; let unassigned occupied rooms be the loud state. Workstation bar stays short: Admit, Staff, Oncoming, Print, Leave. Wall chrome becomes unit name, clock, and a short census, with the wall rules from §6.
3. **Only if slice 2 still feels dated.** Facility-home shell and a designed wall composition behind a flag. Still not a new assignment grid.

## 6. Recommended Route

**Avenue C.** Define “future of healthcare” as a calm clinical command surface: dark or light, high contrast, facility-branded, quiet when the unit is covered, loud only when a room is unassigned or unsafe. Not glass, not wellness illustration, not a marketing gradient, not a new spreadsheet.

**Locked product decisions** (Kurt, 2026-09-21):

- **Board structure:** **Option A — same map, new look.** Keep the 17×10 cell map, drag-and-drop, context menus, Spectra, and both print targets. Do not replace with a new layout (Avenue B parked).
- **Type:** Keep Arial at 18px. Room numbers on the wall may be larger, not smaller.
- **Wall PHI:** Hide patient identifiers only (name, MRN, and other person-identifying fields). Keep clinical quick-reference fields for glance before entering the room, including occupancy, safety marks, and admit / expected-discharge dates. Name-alert *strings* that contain patient names stay off the wall; a non-identifying alert count/state may remain if SEC confirms it does not leak a name.
- **Wall idle lock:** WALLDISPLAY sessions do **not** idle-lock. Shared nurse workstations still idle-lock. SEC must still clear on-screen PHI on explicit logout / switch-user, and print/export stay off the wall role.

**Visual defaults for execution:**

- Light + clinical-dark only. No blue/green/purple product themes.
- Assigned rooms stay full contrast with a small settled mark. Do not use opacity to mean “done.”
- Safety states use distinct shape plus a short text label. Contact, airborne, and droplet stay different from each other and from a generic caution color. Do not fold clinical hues into `--primary`.
- Do not mount identifier-bearing print DOM, native `title` tooltips with names, or copyable name chrome for WALLDISPLAY.
- No new remote assets (font CDNs, icon CDNs, illustration hosts, telemetry). No patient photos, ambient video, pulsing or breathing alerts, sounds, or gamified motion. Honor `prefers-reduced-motion`. No looping motion on safety icons.
- Do not add remember-me, recent-patient lists, or PHI in `localStorage` beyond what already exists.
- Audit log stays admin-visible. Do not put names, MRNs, or clinical notes into new tooltips, toasts, or error text.

**First shippable slice** is foundation (C1) plus the card and header expression (C2) on the workstation. Wall restyle can proceed after SEC tickets the identifier hide + no-idle-lock behavior. Slice 3 does not start unless Kurt says slice 2 still looks dated.

## 7. Alternatives (parked)

- **Avenue B** — new board metaphor. Revisit only after slice 2, and only with an explicit decision to reopen the April keep-list and persisted grid coordinates.
- **Consumer-health visual language** — gradients, illustration, glass, display type, motion. Rejected by CONTRA, RISK, and USER. It fights glare, colorblind glance, print, and the wall.
- **Big-bang restyle of every dialog, shift-maker, wallpaper, and print preset in one ticket.** Shift-maker and wallpaper are outlier skins; print presets stay frozen unless a later ticket restyles `print-styles.ts` while keeping white / 10pt / `.print-hide`. Sequence them after the board, not inside it.

## 8. Risks & Kill Criteria

**Dissent kept visible.** CONTRA would stop at a disciplined token system if Kurt cannot name a workflow the current board cannot do. USER and the intake want the card and header language changed, not only the tokens. This proposal sides with USER on expression and with CONTRA on structure, safety, and motion. If Kurt’s acceptance test is only “the screenshot no longer looks like 2018,” kill the program and do not ship.

Kill or stop the slice when any of these is true:

- Isolation subtype, fall risk, DNR, restraints, or name alerts become icon-only, color-only, or tooltip-only.
- Body or muted text drops below WCAG AA (4.5:1) in light or dark, or body size drops below 18px.
- Patient cards, census, or the name-alert banner use glass, blur, translucency, or gradient washes.
- Motion is added on room cards, or the global `!important` transition is kept.
- Padding, radius, or shadow reduces how many rooms fit versus today, or the full unit stops being the primary view.
- Census chips are collapsed by default.
- A third token system is added instead of retiring `themes.css` overrides.
- The wave rewrites persistence, bumps React or Tailwind majors, or splits `unit-view-client.tsx`.
- WALLDISPLAY shows a patient name, MRN, or other person-identifying field, or mounts identifier-bearing print DOM / name tooltips.
- Smoke can no longer sign in, enter a unit, open the charge report, or drag `[data-patient-id]`.

**Must-mitigate before the wall slice, not before the token slice:** hide patient identifiers only (keep clinical quick-reference), disable idle lock for WALLDISPLAY only, print DOM not mounted for that role when it would leak names, and safety marks that survive grayscale.

## 9. Open Questions for User / PM

### 9.1–9.4 Answered (Kurt, 2026-09-21)

1. **Board:** **A — same map, new look.** Avenue B parked.
2. **Wall content:** hide patient identifiers only; keep clinical quick-reference (including admit/EDD).
3. **Type:** keep Arial at 18px.
4. **Wall idle lock:** none. Nurse workstations still lock.

No blocking product questions remain for Avenue C. Ready to park or send to PM-01 on request.

## 10. Suggested PM Handoff

- `prop_id`: not assigned. On send, use **PROP-3** (`PROP-3-clinical-command-surface`) unless a later proposal takes 3 first. See `docs/agents/PROP_NUMBERING.md`.
- Suggested splits (hints only; TINA may re-divide):
  - `PROP-3.1` — **FED-01** — One token source: map `global_theme` to light versus `.dark`, stop applying `themes.css` overrides and the global transition, keep print CSS white / ~10pt / `.print-hide`, keep Arial 18px. Do not redesign the vault.
  - `PROP-3.2` — **FED-01** — Workstation expression on the **same** grid: patient and staff cards, grouped census header, no assigned-room fade, labeled safety marks (shape + text). Preserve smoke selectors and drag nodes. Do not change stored `gridRow` / `gridColumn`.
  - `PROP-3.3` — **SEC-01** — WALLDISPLAY: hide patient identifiers only; keep clinical quick-reference; disable idle lock for wall sessions only; ensure print DOM / name tooltips do not leak identifiers.
  - `PROP-3.4` — **FED-01** — Wall chrome (unit, clock, short census, larger room numbers) after `PROP-3.3`.
  - `PROP-3.5` — **QA-01** — Smoke plus contrast and safety-glance check (workstation and print; wall if 3.4 shipped). Confirm wall shows no patient identifiers and does not idle-lock. No screenshot-only pass.
- What PM should decide first: accept Avenue C with Kurt’s four locks, then ticket `PROP-3.1` → `3.2` in parallel with `3.3` as capacity allows. Do **not** open Avenue B.
