import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyCensusToRooms, normalizeRoomKey } from './apply-census';
import { mapPatientToCensus } from './mapper';
import { buildSandboxContexts } from './sandbox-fixtures';
import type { CensusRecord } from './types';

interface TestRoom {
  id: string;
  bedNumber: number;
  roomDesignation: string;
  name: string;
  fhirPatientId?: string;
  chiefComplaint?: string;
  fhirStale?: boolean;
}

function applyClinical(room: TestRoom, record: CensusRecord, stale: boolean): TestRoom {
  return {
    ...room,
    name: stale ? room.name : record.name,
    fhirPatientId: record.fhirPatientId,
    chiefComplaint: stale ? room.chiefComplaint : record.chiefComplaint,
    fhirStale: stale,
  };
}

test('normalizes room labels to digit keys', () => {
  assert.equal(normalizeRoomKey('Room 812'), '812');
  assert.equal(normalizeRoomKey('EMC IP 0812'), '812');
});

test('matches census patients onto rooms by room number', () => {
  const rooms: TestRoom[] = [
    { id: 'r1', bedNumber: 1, roomDesignation: 'Room 812', name: 'Vacant' },
    { id: 'r2', bedNumber: 2, roomDesignation: 'Room 813', name: 'Vacant' },
    { id: 'r3', bedNumber: 3, roomDesignation: 'Room 900', name: 'Vacant' },
  ];
  const census = buildSandboxContexts().map((ctx) =>
    mapPatientToCensus(ctx, { now: new Date(Date.UTC(2026, 7, 29)) })
  );
  const result = applyCensusToRooms(rooms, census, applyClinical);
  assert.equal(result.matched, 2);
  assert.equal(result.filledVacant, 1);
  assert.equal(result.rooms[0]?.name, 'Camila Lopez');
  assert.equal(result.rooms[1]?.name, 'Derrick Lin');
  assert.equal(result.rooms[2]?.name, 'Elijah Roberts');
});

test('marks previously synced patients stale when they leave the census', () => {
  const rooms: TestRoom[] = [
    {
      id: 'r1',
      bedNumber: 1,
      roomDesignation: 'Room 812',
      name: 'Camila Lopez',
      fhirPatientId: 'erXuFYUfucBZaryVksYEcMg3',
      chiefComplaint: 'Community-acquired pneumonia',
    },
  ];
  const result = applyCensusToRooms(rooms, [], applyClinical);
  assert.equal(result.markedStale, 1);
  assert.equal(result.rooms[0]?.fhirStale, true);
  assert.equal(result.rooms[0]?.name, 'Camila Lopez');
});
