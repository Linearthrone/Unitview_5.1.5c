export interface CensusRecordLike {
  fhirPatientId: string;
  fhirEncounterId?: string;
  mrn?: string;
  name: string;
  age: number;
  gender?: 'Male' | 'Female';
  admitDate: string;
  dischargeDate?: string;
  chiefComplaint: string;
  roomHint: string;
  diet: string;
  mobility: 'Bed Rest' | 'Assisted' | 'Independent';
  codeStatus: 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
  orientationStatus: 'x1' | 'x2' | 'x3' | 'x4' | 'N/A';
  ldas: string[];
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
  notes?: string;
}

export interface RoomLike {
  id: string;
  bedNumber: number;
  roomDesignation: string;
  name: string;
  fhirPatientId?: string;
  fhirEncounterId?: string;
  mrn?: string;
  isBlocked?: boolean;
}

export function normalizeRoomKey(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.replace(/^0+/, '') || '0';
  }
  return value.trim().toLowerCase();
}

function isVacant(name: string): boolean {
  return name.trim() === '' || name.trim() === 'Vacant';
}

export function applyCensusToRooms<T extends RoomLike>(
  rooms: T[],
  census: CensusRecordLike[],
  applyClinical: (room: T, record: CensusRecordLike, stale: boolean) => T
): { rooms: T[]; matched: number; filledVacant: number; unmatchedCensus: number; markedStale: number } {
  if (!Array.isArray(rooms) || !Array.isArray(census)) {
    throw new Error('rooms and census must be arrays');
  }

  const remaining = [...census];
  const usedFhirIds = new Set<string>();
  let matched = 0;
  let filledVacant = 0;
  let markedStale = 0;

  const next = rooms.map((room) => {
    if (room.isBlocked) return room;

    const byFhir = remaining.findIndex(
      (record) => room.fhirPatientId && record.fhirPatientId === room.fhirPatientId
    );
    if (byFhir !== -1) {
      const record = remaining.splice(byFhir, 1)[0];
      if (record) {
        usedFhirIds.add(record.fhirPatientId);
        matched += 1;
        return applyClinical(room, record, false);
      }
    }

    const roomKey = normalizeRoomKey(room.roomDesignation);
    const byRoom = remaining.findIndex(
      (record) => record.roomHint && normalizeRoomKey(record.roomHint) === roomKey
    );
    if (byRoom !== -1) {
      const record = remaining.splice(byRoom, 1)[0];
      if (record) {
        usedFhirIds.add(record.fhirPatientId);
        matched += 1;
        return applyClinical(room, record, false);
      }
    }

    if (room.fhirPatientId && !usedFhirIds.has(room.fhirPatientId) && !isVacant(room.name)) {
      markedStale += 1;
      return applyClinical(room, {
        fhirPatientId: room.fhirPatientId,
        fhirEncounterId: room.fhirEncounterId,
        mrn: room.mrn,
        name: room.name,
        age: 0,
        admitDate: new Date(0).toISOString(),
        chiefComplaint: 'N/A',
        roomHint: room.roomDesignation,
        diet: 'N/A',
        mobility: 'Independent',
        codeStatus: 'Full Code',
        orientationStatus: 'N/A',
        ldas: [],
        isFallRisk: false,
        isSeizureRisk: false,
        isAspirationRisk: false,
        isIsolation: false,
        isInRestraints: false,
        isComfortCareDNR: false,
      }, true);
    }

    return room;
  });

  const filled = next.map((room) => {
    if (room.isBlocked || !isVacant(room.name) || remaining.length === 0) {
      return room;
    }
    const record = remaining.shift();
    if (!record) return room;
    filledVacant += 1;
    usedFhirIds.add(record.fhirPatientId);
    return applyClinical(room, record, false);
  });

  return {
    rooms: filled,
    matched,
    filledVacant,
    unmatchedCensus: remaining.length,
    markedStale,
  };
}
