# TASK-20260422-013 — PM Clarifications Resolved

| Field | Value |
|:------|:------|
| **From** | PM-01 |
| **Date** | 2026-04-30 |
| **Status** | **Approved for Phase 2 build** |
| **User checklist** | `docs/agents/ui-review/TASK-20260422-013-UI-DECISION-CHECKLIST.md` |

---

## Clarification decisions (user confirmed)

| # | Topic | Decision |
|:-:|-------|----------|
| 1 | Settings screen vs modal (**2.5.1**) | **Keep full settings screen** (not modal) |
| 2 | Spectra pool button (**3.5.3**) | **B + C:** Move to right Spectra panel; **role-gated** to Nurse Manager, Charge Nurse, Entity/Facility Admin |
| 3 | Sticky header (**3.7.4**) | **Sticky action bar only** on scroll; census/stats row scrolls away |
| 4 | Replace `window.prompt` for device logs (**6.2.3**) | **Approve** — use in-app modal |
| 5 | Hidden printable HTML targets (**7.4.11–12**) | **Keep** — backend print pipeline only; no user-facing UI |
| 6 | High-risk category badges (**7.1.7**) | **Expand** — show on **both** patient card footer **and** patient details sheet |
| 7 | Reset password dialog (**9.1.5**) | **Keep for now**; document deprecation when SSO is integrated |
| 8 | WALLDISPLAY role (**4.2.2**) | **Read-only**; **no patient identifiers** (names/PHI) on room cards or sheets |

---

## Assumed defaults (no user objection)

| Item | PM default |
|------|------------|
| 2.3.5 Enter unit action | Keep |
| 2.3.6 Last-opened unit highlight | Keep |

---

## Major build themes (from user checklist)

### Roles & permissions
- Role set: **Entity Admin, Facility Admin, Nurse Manager, Charge Nurse, Nurse, WALLDISPLAY**
- Admin-only: create unit/room, edit unit, save layout, mock patients (menu button only), edit room designation, dev auto-seeder removed
- Login: no separate admin link; permissions from profile
- Demo credentials: admin settings only (`admin`/`password`), never on login screen

### Login & dashboard
- Facility logo + name placeholder on login branding
- Theme in Settings with improved contrast
- Isolation breakdown: contact / airborne / droplet (facility stats)
- Unit dropdown must display selected unit in control

### Unit header & layout
- Print → time/navigation area
- Save shift assignments + icon explanation → primary action bar
- Leave unit → bottom-right corner
- Exclude: layout lock, save current layout, north/south map labels
- Add stat chips: central lines, tube feeds
- Assigned nurse indicator → green check on card

### Map & patients
- Quick note on patient context menu (timestamp + user ID → patient notes)
- Gender → male/female icon blue/pink upper-left (not name badge fill)
- WALLDISPLAY: room + alerts only, no names

### Spectra
- Table ~1/3 width, right panel (collapsible)
- Spectra management entry in panel header (role-gated)
- Device logs dialog: admin task (exclude from general user UI per user sheet)

### Patient details sheet
- Expand critical quick checks: isolation, restraints, DNR/DNI, comfort care, time-critical meds, HD/PD, blood orders
- Tabbed layout approved (7.5.1)
- High-risk badges expanded on card + sheet

### Shift maker
- Save-on-close for oncoming draft; restore on reopen
- Assign staff member on oncoming nurse cards
- Clinical-dark theme alignment approved

### Staff cards
- TASK-20260430-007: `+ Assign staff member`, AssignStaffDialog with card context
- Unified neutral card surfaces approved

### Theme
- Clinical-dark default; stronger muted-foreground contrast
- Deprecate per-unit dashboard color themes over time
- All user-approved 10.2.x suggestions

---

## Phase 2 DEV execution order (recommended)

1. **Foundation:** roles/permissions scaffold + WALLDISPLAY read-only mode
2. **Theme tokens:** clinical-dark + contrast (TASK-005 overlap)
3. **Layout:** header reorg, right Spectra panel, sticky action bar
4. **Components:** staff cards (007), patient cards, dashboard, login branding
5. **Features:** quick note, isolation breakdown, expanded patient sheet, shift save-on-close
6. **Polish:** print modal, sticky bar, dropdown selection fix

---

## Related tasks to merge or sequence

| Task | Action |
|------|--------|
| TASK-20260430-007 | Include in Phase 2 staff card work |
| TASK-20260430-005 | Fold contrast into theme pass |
| TASK-20260422-022 | Print layout GUI — separate lane, coordinate print menu move |

**Phase 2 may begin.**
