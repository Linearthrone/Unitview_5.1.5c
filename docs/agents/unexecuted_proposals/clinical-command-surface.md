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
3. **Same job.** The 17×10 map, stable room positions, drag-and-drop, census contents, admit/discharge dialogs, Spectra, and both print targets stay. WALLDISPLAY still hides identifiers.
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

## 4. Clarifying Q&A (answered)

Kurt did not answer follow-ups before this pass. The thinktank ran on the stated need plus the checklist and the current renderer. Open decisions are in §9. Recommended defaults are in §6 so PM is not blocked if Kurt accepts the route as written.

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
| How “full” is full | Kurt’s words and USER want a redesign of the experience. CONTRA and STRAT say a new information architecture will fail day-one recognition and the April keep-list. | Redesign chrome, type, card language, census grouping, and wall versus workstation chrome. Do **not** replace the 17×10 map. |
| Arial | STRAT and CONTRA treat 18px Arial as a locked checklist vote. USER says the vote was for large readable type, not that face. | Keep the 18px floor. A bundled sans is allowed only if contrast holds. Do not block slice 1 on the face. |
| Themes | Checklist both keeps five themes and retires them. SYS says settings already collapsed to light and clinical-dark. | Ship light + clinical-dark only. Leave stored blue/green/purple values readable and unused. |
| Wall dates | RISK wants admit/EDD off the wall. USER wants occupancy and safety, not a second header. | Recommended default: hide dates and names on the wall. Kurt can override in §9 before the wall slice. |

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
2. **Expression, same grid.** Restyle patient, nurse, charge, clerk, and tech cards without moving drag nodes or renaming controls the smoke test uses. Room number stays the largest text. Replace the icon footer with a few labeled safety marks (shape + text). Group header census into census, safety, and devices instead of one equal chip ribbon. Stop fading assigned rooms; let unassigned occupied rooms be the loud state. Workstation bar stays short: Admit, Staff, Oncoming, Print, Leave. Wall chrome becomes unit name, clock, and a short census, with the allow-list from §6.
3. **Only if slice 2 still feels dated.** Facility-home shell and a designed wall composition behind a flag. Still not a new assignment grid.

## 6. Recommended Route

**Avenue C.** Define “future of healthcare” as a calm clinical command surface: dark or light, high contrast, facility-branded, quiet when the unit is covered, loud only when a room is unassigned or unsafe. Not glass, not wellness illustration, not a marketing gradient, not a new spreadsheet.

**Recommended defaults** (Kurt can override §9 before PM tickets the matching slice):

- Keep the 17×10 cell map, drag-and-drop, context menus, Spectra, and both print targets.
- Light + clinical-dark only. No blue/green/purple product themes.
- Body text at least 18px. Room numbers on the wall larger, not smaller. Typeface may change only to a font bundled in the app.
- Assigned rooms stay full contrast with a small settled mark. Do not use opacity to mean “done.”
- Safety states use distinct shape plus a short text label. Contact, airborne, and droplet stay different from each other and from a generic caution color. Do not fold clinical hues into `--primary`.
- **Wall allow-list:** room, occupancy (occupied / vacant / blocked), unassigned, and the safety marks. No name, MRN, gender, age, allergy, complaint, notes, staff names, name-alert strings, Epic ids, or admit/EDD dates. Do not mount identifier-bearing print DOM, native `title` tooltips, or copyable chrome for WALLDISPLAY. Print and export stay off that role.
- No new remote assets (font CDNs, icon CDNs, illustration hosts, telemetry). No patient photos, ambient video, pulsing or breathing alerts, sounds, or gamified motion. Honor `prefers-reduced-motion`. No looping motion on safety icons.
- Shared workstations keep idle lock. Do not add remember-me, recent-patient lists, or PHI in `localStorage` beyond what already exists. Lock and switch-user must clear on-screen PHI, including off-screen print DOM.
- Audit log stays admin-visible. Do not put names, MRNs, or clinical notes into new tooltips, toasts, or error text.

**First shippable slice** is foundation (C1) plus the card and header expression (C2) on the workstation. Wall restyle (part of C2) waits on Kurt confirming the allow-list. Slice 3 does not start unless he says slice 2 still looks dated.

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
- WALLDISPLAY or print shows identifiers outside the allow-list.
- Smoke can no longer sign in, enter a unit, open the charge report, or drag `[data-patient-id]`.

**Must-mitigate before the wall slice, not before the token slice:** the allow-list above, print DOM not mounted for WALLDISPLAY, and safety marks that survive grayscale.

## 9. Open Questions for User / PM

1. **Board metaphor.** Accept the recommendation (same 17×10 map, new card and chrome language), or reopen a new layout knowing it changes stored positions?
2. **Wall allow-list.** Accept “no identifiers at all,” including admit and expected-discharge dates, or keep dates on the wall?
3. **Typeface.** Keep Arial at 18px, or allow one bundled sans if the 18px floor and AA contrast hold?
4. **Idle lock on the wall.** Should a WALLDISPLAY session stay up without the 15-minute idle logout while nurse workstations still lock? (Risk flagged this; it is a product/security decision, not a skin decision.)

PM should not ticket slice 3, a new grid, or a wall restyle until 1 and 2 are answered. Slices for tokens and workstation card skin can proceed on the defaults in §6.

## 10. Suggested PM Handoff

- `prop_id`: not assigned. On send, use **PROP-3** (`PROP-3-clinical-command-surface`) unless a later proposal takes 3 first. See `docs/agents/PROP_NUMBERING.md`.
- Suggested splits (hints only; TINA may re-divide):
  - `PROP-3.1` — **FED-01** — One token source: map `global_theme` to light versus `.dark`, stop applying `themes.css` overrides and the global transition, keep print CSS white / ~10pt / `.print-hide`. Do not redesign the vault.
  - `PROP-3.2` — **FED-01** — Workstation expression on the same grid: patient and staff cards, grouped census header, no assigned-room fade, labeled safety marks (shape + text). Preserve smoke selectors and drag nodes.
  - `PROP-3.3` — **SEC-01** — WALLDISPLAY privacy pass against the allow-list (including unmounted print DOM and tooltips) before any wall restyle.
  - `PROP-3.4` — **FED-01** — Wall chrome (unit, clock, short census, larger room numbers) using the SEC allow-list. Only after `PROP-3.3` and Kurt’s answer to §9.2.
  - `PROP-3.5` — **QA-01** — Smoke plus a contrast and safety-glance check (workstation and print; wall if 3.4 shipped). No screenshot-only pass.
- What PM should decide first: accept Avenue C and the §6 defaults, and whether Kurt must answer §9.2 and §9.4 before any wall ticket. Do not open Avenue B in the same wave.
