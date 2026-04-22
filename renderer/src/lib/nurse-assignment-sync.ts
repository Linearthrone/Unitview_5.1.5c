import type { Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';

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
    return { ...p, assignedNurse: name };
  });
}
