import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildWallpaperSnapshot } from './wallpaper-snapshot';
import type { Patient } from '../types/patient';
import type { Nurse, PatientCareTech } from '../types/nurse';

function vacantRoom(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'p1',
    bedNumber: 1,
    roomDesignation: '101',
    name: 'Vacant',
    age: 0,
    admitDate: new Date('2026-01-01'),
    dischargeDate: new Date('2026-01-02'),
    chiefComplaint: '',
    ldas: [],
    diet: '',
    mobility: 'Independent',
    codeStatus: 'Full Code',
    orientationStatus: 'N/A',
    isFallRisk: false,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    gridRow: 1,
    gridColumn: 1,
    ...overrides,
  };
}

test('buildWallpaperSnapshot redacts patient names when requested', () => {
  const patients = [
    vacantRoom({
      id: 'occ',
      name: 'Jordan Lee',
      roomDesignation: '202',
      gridRow: 2,
      gridColumn: 3,
      isFallRisk: true,
    }),
  ];
  const nurses: Nurse[] = [
    {
      id: 'n1',
      name: 'RN Adams',
      role: 'Staff Nurse',
      assignedPatientIds: ['occ', null],
      gridRow: 2,
      gridColumn: 1,
      cardRowSpan: 2,
    },
  ];
  const techs: PatientCareTech[] = [];

  const snap = buildWallpaperSnapshot({
    unitName: 'North',
    patients,
    nurses,
    techs,
    redactPhi: true,
    now: 1_700_000_000_000,
  });

  assert.equal(snap.unitName, 'North');
  assert.equal(snap.redactPhi, true);
  assert.equal(snap.patients[0]?.displayName, '');
  assert.equal(snap.patients[0]?.isVacant, false);
  assert.equal(snap.patients[0]?.isFallRisk, true);
  assert.equal(snap.nurses[0]?.filledSlots, 1);
  assert.equal(snap.nurses[0]?.totalSlots, 2);
  assert.equal(snap.updatedAt, 1_700_000_000_000);
});

test('buildWallpaperSnapshot keeps names when redactPhi is false', () => {
  const snap = buildWallpaperSnapshot({
    unitName: 'South',
    patients: [vacantRoom({ name: 'Alex Kim', roomDesignation: 'A1' })],
    nurses: [],
    techs: [],
    redactPhi: false,
  });
  assert.equal(snap.patients[0]?.displayName, 'Alex Kim');
});
