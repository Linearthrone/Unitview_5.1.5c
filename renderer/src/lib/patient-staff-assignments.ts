import type { PatientCareTech, Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import { isPatientNurseAssigned } from '@/lib/nurse-assignment-sync';

const ASSIGNABLE_NURSE_ROLES = new Set(['Staff Nurse', 'Float Pool Nurse']);

function extractRoomNumber(label: string): number | null {
  const match = label.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function roomLabelMatchesGroup(roomDesignation: string, group: string): boolean {
  const room = roomDesignation.trim();
  const assignmentGroup = group.trim();
  if (!room || !assignmentGroup) return false;

  if (assignmentGroup.includes(' - ')) {
    const [startLabel, endLabel] = assignmentGroup.split(' - ').map((part) => part.trim());
    const roomNum = extractRoomNumber(room);
    const startNum = extractRoomNumber(startLabel);
    const endNum = extractRoomNumber(endLabel);
    if (roomNum !== null && startNum !== null && endNum !== null) {
      const low = Math.min(startNum, endNum);
      const high = Math.max(startNum, endNum);
      return roomNum >= low && roomNum <= high;
    }
    return room === startLabel || room === endLabel;
  }

  return room.toLowerCase() === assignmentGroup.toLowerCase();
}

/** Live nurse assignment from nurse card slots (source of truth). */
export function resolveAssignedNurse(patient: Patient, nurses: Nurse[]): string | undefined {
  for (const nurse of nurses) {
    if (!ASSIGNABLE_NURSE_ROLES.has(nurse.role)) continue;
    if (nurse.assignedPatientIds.some((id) => id === patient.id)) {
      const name = nurse.name?.trim();
      if (name) return name;
    }
  }
  return isPatientNurseAssigned(patient.assignedNurse) ? patient.assignedNurse : undefined;
}

/** Live PCT assignment inferred from room ranges on tech cards. */
export function resolveAssignedTech(patient: Patient, techs: PatientCareTech[]): string | undefined {
  for (const tech of techs) {
    const name = tech.name?.trim();
    const group = tech.assignmentGroup?.trim();
    if (!name || !group) continue;
    if (roomLabelMatchesGroup(patient.roomDesignation, group)) {
      return name;
    }
  }
  return undefined;
}

export function formatStaffAssignmentLabel(name?: string): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : 'Unassigned';
}

/** Copy current live nurse/PCT assignments onto each patient as prior-shift reference. */
export function snapshotPriorShiftStaff(
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
): Patient[] {
  return patients.map((patient) => {
    if (patient.name === 'Vacant' || patient.isBlocked) return patient;
    const priorShiftNurse = resolveAssignedNurse(patient, nurses);
    const priorShiftTech = resolveAssignedTech(patient, techs);
    if (
      patient.priorShiftNurse === priorShiftNurse &&
      patient.priorShiftTech === priorShiftTech
    ) {
      return patient;
    }
    return {
      ...patient,
      priorShiftNurse,
      priorShiftTech,
    };
  });
}
