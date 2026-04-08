import type { Patient } from '@/types/patient';
import type { Nurse } from '@/types/nurse';

export function isOccupiedBed(name: string): boolean {
  return name.trim() !== '' && name !== 'Vacant';
}

/** Georgia-style involuntary hold keywords in notes or LDAs (until dedicated fields exist). */
export function patientHasInvoluntaryHoldKeywords(patient: Patient): boolean {
  const fromLdas = (patient.ldas ?? []).join(' ');
  const hay = `${patient.notes ?? ''} ${fromLdas}`;
  return /\b(1013|2013)\b/i.test(hay);
}

function normalizeStaffName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Count occupied patients whose assigned nurse matches a staff member with role Sitter. */
export function countPatientsWithSitterNurse(patients: Patient[], nurses: Nurse[]): number {
  const sitterNames = new Set(
    nurses.filter((n) => n.role === 'Sitter' && n.name?.trim()).map((n) => normalizeStaffName(n.name))
  );
  if (sitterNames.size === 0) return 0;
  return patients.filter((p) => {
    if (!isOccupiedBed(p.name)) return false;
    const a = p.assignedNurse?.trim();
    if (!a) return false;
    return sitterNames.has(normalizeStaffName(a));
  }).length;
}
