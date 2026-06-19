---
issue_id: ISSUE-20260430-001
found_at: 2026-04-30
severity: P2
status: Open
reported_by: User
owner: PM-01
---

# Mock patient pool is too small for full-unit seeding

## Problem

`insertMockPatients()` cycles through ~30 mock profiles. North-South View has ~43 rooms, so filling vacant beds repeats names and clinical scenarios.

## Expected behavior

- Enough unique mock patients to populate the largest default unit without repeating profiles in one insert pass.
- Broader variety of ages, complaints, flags (isolation, restraints, DNR, fall risk, name-similarity pairs for alert testing).

## Likely file

- `renderer/src/lib/mock-patients.ts`
