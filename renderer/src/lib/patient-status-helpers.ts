import type { Patient } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';

export function isOccupiedBed(name: string): boolean {
  return name.trim() !== '' && name !== 'Vacant';
}

export function isSameCalendarDay(dateValue: Date, target: Date): boolean {
  return (
    dateValue.getFullYear() === target.getFullYear() &&
    dateValue.getMonth() === target.getMonth() &&
    dateValue.getDate() === target.getDate()
  );
}

/** Patient is still in the room but clinically discharged, awaiting transport. */
export function isAwaitingTransport(patient: Patient): boolean {
  return Boolean(patient.awaitingTransport);
}

/** Occupied bed with EDD on the given calendar day. */
export function isAnticipatedDischargeToday(patient: Patient, today = new Date()): boolean {
  if (!isOccupiedBed(patient.name) || isAwaitingTransport(patient)) return false;
  return isSameCalendarDay(new Date(patient.dischargeDate), today);
}

/** Show transport icon when discharging today or already discharged awaiting pickup. */
export function patientNeedsTransportIndicator(patient: Patient, today = new Date()): boolean {
  return isAwaitingTransport(patient) || isAnticipatedDischargeToday(patient, today);
}

export interface UnitCensusStats {
  beddedPatients: number;
  availableBeds: number;
  blockedRooms: number;
  anticipatedDischarges: number;
  nurseCount: number;
  pctCount: number;
  maxPatientsAllowed: number;
}

/** Nurse roles that count toward patient assignment capacity for the shift. */
const CLINICAL_NURSE_ROLES = new Set<Nurse['role']>([
  'Staff Nurse',
  'Charge Nurse',
  'Float Pool Nurse',
]);

export function countClinicalNurses(nurses: Nurse[]): number {
  return nurses.filter((n) => CLINICAL_NURSE_ROLES.has(n.role)).length;
}

export function computeMaxPatientsForStaff(
  nurseCount: number,
  patientsPerNurse: number,
): number {
  if (nurseCount <= 0) return 0;
  return nurseCount * Math.max(1, patientsPerNurse);
}

export function computeUnitCensusStats(
  patients: Patient[],
  nurses: Nurse[] = [],
  techs: PatientCareTech[] = [],
  patientsPerNurse = 4,
  today = new Date(),
): UnitCensusStats {
  const beddedPatients = patients.filter((p) => isOccupiedBed(p.name)).length;
  const availableBeds = patients.filter((p) => p.name === 'Vacant' && !p.isBlocked).length;
  const blockedRooms = patients.filter((p) => p.isBlocked).length;
  const anticipatedDischarges = patients.filter((p) => isAnticipatedDischargeToday(p, today)).length;
  const nurseCount = countClinicalNurses(nurses);
  const pctCount = techs.length;
  const maxPatientsAllowed = computeMaxPatientsForStaff(nurseCount, patientsPerNurse);
  return {
    beddedPatients,
    availableBeds,
    blockedRooms,
    anticipatedDischarges,
    nurseCount,
    pctCount,
    maxPatientsAllowed,
  };
}

/** Legacy keyword scan in notes / LDAs (for migrated records). */
export function patientHasInvoluntaryHoldKeywords(patient: Patient): boolean {
  const fromLdas = (patient.ldas ?? []).join(' ');
  const hay = `${patient.notes ?? ''} ${patient.pendingProcedures ?? ''} ${fromLdas}`;
  return /\b(1013|2013)\b/i.test(hay);
}

export function patientHasInvoluntaryHold(patient: Patient): boolean {
  return Boolean(patient.isInvoluntaryHold1013) || patientHasInvoluntaryHoldKeywords(patient);
}

function normalizeStaffName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** First assigned sitter nurse on the unit, if any. */
export function findSitterStaffName(nurses: Nurse[]): string | undefined {
  return nurses.find((n) => n.role === 'Sitter' && n.name?.trim())?.name?.trim();
}

/** Apply sitter flags and assign to sitter staff when required. */
export function applySitterRequirements(patient: Patient, nurses: Nurse[]): Patient {
  const needsSitter = Boolean(patient.requiresSitter || patient.isInvoluntaryHold1013);
  if (!needsSitter) return patient;

  const sitterName = findSitterStaffName(nurses);
  return {
    ...patient,
    requiresSitter: true,
    assignedNurse: sitterName ?? patient.assignedNurse,
  };
}

/** Count occupied patients flagged for sitter or assigned to sitter staff. */
export function countPatientsRequiringSitter(patients: Patient[], nurses: Nurse[]): number {
  const sitterNames = new Set(
    nurses.filter((n) => n.role === 'Sitter' && n.name?.trim()).map((n) => normalizeStaffName(n.name)),
  );

  return patients.filter((p) => {
    if (!isOccupiedBed(p.name)) return false;
    if (p.requiresSitter || p.isInvoluntaryHold1013) return true;
    const assigned = p.assignedNurse?.trim();
    return assigned ? sitterNames.has(normalizeStaffName(assigned)) : false;
  }).length;
}

/** @deprecated Use countPatientsRequiringSitter */
export function countPatientsWithSitterNurse(patients: Patient[], nurses: Nurse[]): number {
  return countPatientsRequiringSitter(patients, nurses);
}

/** Infer new fields from legacy free-text notes on load. */
export function migratePatientCareFlags(patient: Patient): Patient {
  let isInvoluntaryHold1013 = Boolean(patient.isInvoluntaryHold1013);
  let requiresSitter = Boolean(patient.requiresSitter);

  if (!isInvoluntaryHold1013 && patientHasInvoluntaryHoldKeywords(patient)) {
    isInvoluntaryHold1013 = true;
  }

  const hay = `${patient.notes ?? ''} ${patient.pendingProcedures ?? ''}`.toLowerCase();
  if (!requiresSitter && /\bsitter\b|1:1|one-to-one/i.test(hay)) {
    requiresSitter = true;
  }

  if (isInvoluntaryHold1013) {
    requiresSitter = true;
  }

  return {
    ...patient,
    isInvoluntaryHold1013,
    requiresSitter,
    pendingProcedures: patient.pendingProcedures ?? '',
  };
}
