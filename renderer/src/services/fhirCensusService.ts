import { applyCensusToRooms, type CensusRecordLike } from '../lib/fhir-apply-census';
import type { Patient } from '../types/patient';
import { recordAudit } from '../lib/audit-client';

function applyClinical(room: Patient, record: CensusRecordLike, stale: boolean): Patient {
  if (stale) {
    return { ...room, fhirStale: true };
  }
  return {
    ...room,
    name: record.name,
    age: record.age,
    gender: record.gender,
    admitDate: new Date(record.admitDate),
    dischargeDate: record.dischargeDate ? new Date(record.dischargeDate) : room.dischargeDate,
    chiefComplaint: record.chiefComplaint,
    diet: record.diet,
    mobility: record.mobility,
    codeStatus: record.codeStatus,
    orientationStatus: record.orientationStatus,
    ldas: record.ldas,
    isFallRisk: record.isFallRisk,
    isSeizureRisk: record.isSeizureRisk,
    isAspirationRisk: record.isAspirationRisk,
    isIsolation: record.isIsolation,
    isInRestraints: record.isInRestraints,
    isComfortCareDNR: record.isComfortCareDNR,
    notes: record.notes,
    fhirPatientId: record.fhirPatientId,
    fhirEncounterId: record.fhirEncounterId,
    mrn: record.mrn,
    fhirStale: false,
    lastFhirSyncAt: new Date().toISOString(),
  };
}

export async function syncEpicCensus(
  rooms: Patient[],
  actorEmployeeNumber?: string
): Promise<{
  rooms: Patient[];
  matched: number;
  filledVacant: number;
  unmatchedCensus: number;
  markedStale: number;
  source: 'epic' | 'sandbox_fixtures';
}> {
  if (!window.electronAPI?.fetchEpicCensus) {
    throw new Error('Epic FHIR is only available in the desktop application');
  }
  const result = await window.electronAPI.fetchEpicCensus(actorEmployeeNumber);
  if (!result.success || !result.records) {
    throw new Error(result.error || 'Epic census sync failed');
  }
  const applied = applyCensusToRooms(rooms, result.records, applyClinical);
  await recordAudit({
    action: 'FHIR_SYNC',
    actorEmployeeNumber,
    resourceType: 'Patient',
    success: true,
    detail: `matched=${applied.matched};filled=${applied.filledVacant};source=${result.source}`,
  });
  return {
    ...applied,
    source: result.source ?? 'sandbox_fixtures',
  };
}
