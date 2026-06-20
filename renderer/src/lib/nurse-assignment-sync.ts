import type { Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';

const PLACEHOLDER_NURSE_NAMES = new Set(['to be assigned', 'unassigned']);

/** Whether a patient record reflects a real nurse assignment (not a form placeholder). */
export function isPatientNurseAssigned(assignedNurse?: string): boolean {
  const trimmed = assignedNurse?.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_NURSE_NAMES.has(trimmed.toLowerCase());
}

/** Sets each occupied patient's `assignedNurse` from current nurse slot assignments. */
export function syncPatientsAssignedNurseFromNurses(patients: Patient[], nurses: Nurse[]): Patient[] {
  const nurseNameByPatientId = new Map<string, string>();
  for (const n of nurses) {
    for (const pid of n.assignedPatientIds) {
      if (pid) nurseNameByPatientId.set(pid, n.name);
    }
  }
  return patients.map((p) => {
    if (p.name === 'Vacant' || p.isBlocked) return p;
    const name = nurseNameByPatientId.get(p.id);
    if (p.assignedNurse === name) return p;
    return { ...p, assignedNurse: name };
  });
}

export function applyDropOnNurseSlot(
  patients: Patient[],
  nurses: Nurse[],
  draggedPatientId: string,
  targetNurseId: string,
): { nurses: Nurse[]; patients: Patient[] } | null {
  const draggedPatient = patients.find((p) => p.id === draggedPatientId);
  const targetNurse = nurses.find((n) => n.id === targetNurseId);
  if (!draggedPatient || !targetNurse) return null;

  const currentAssignedIds = targetNurse.assignedPatientIds.filter(
    (id) => id !== null && id !== draggedPatientId,
  );
  const newAssignedIds = [...currentAssignedIds, draggedPatientId];

  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const sortedPatientIds = newAssignedIds.sort((idA, idB) => {
    const patientA = patientMap.get(idA);
    const patientB = patientMap.get(idB);
    if (!patientA || !patientB) return 0;
    return patientA.bedNumber - patientB.bedNumber;
  });

  const nurseCapacity = Math.max(1, targetNurse.assignedPatientIds.length);
  const finalPaddedIds: (string | null)[] = Array(nurseCapacity).fill(null);
  sortedPatientIds.forEach((id, index) => {
    if (index < nurseCapacity) {
      finalPaddedIds[index] = id;
    }
  });

  const newNurses = nurses.map((nurse) => {
    if (nurse.id === targetNurseId) {
      return { ...nurse, assignedPatientIds: finalPaddedIds };
    }
    const updatedIds = nurse.assignedPatientIds.map((id) => (id === draggedPatientId ? null : id));
    return { ...nurse, assignedPatientIds: updatedIds };
  });

  const newPatients = syncPatientsAssignedNurseFromNurses(patients, newNurses);
  return { nurses: newNurses, patients: newPatients };
}
