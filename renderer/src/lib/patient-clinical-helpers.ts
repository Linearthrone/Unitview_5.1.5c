import type { Patient } from '@/types/patient';

export type IsolationPrecaution = 'Contact' | 'Airborne' | 'Droplet' | 'Isolation';

function clinicalHaystack(patient: Patient): string {
  return `${patient.notes ?? ''} ${patient.chiefComplaint ?? ''} ${(patient.ldas ?? []).join(' ')}`.toLowerCase();
}

/** Infer isolation precaution type from patient chart text (§2.2.7, §7.1.6). */
export function getIsolationType(patient: Patient): IsolationPrecaution | null {
  if (!patient.isIsolation) return null;
  const haystack = clinicalHaystack(patient);
  if (haystack.includes('airborne')) return 'Airborne';
  if (haystack.includes('droplet')) return 'Droplet';
  if (haystack.includes('contact')) return 'Contact';
  return 'Isolation';
}

export function hasTimeCriticalMeds(patient: Patient): boolean {
  const haystack = clinicalHaystack(patient);
  return (
    haystack.includes('time critical') ||
    haystack.includes('time-critical') ||
    haystack.includes('critical med')
  );
}

export function hasHdPd(patient: Patient): boolean {
  const haystack = clinicalHaystack(patient);
  return (
    /\bhd\b/.test(haystack) ||
    /\bpd\b/.test(haystack) ||
    haystack.includes('hemodialysis') ||
    haystack.includes('peritoneal dialysis') ||
    haystack.includes('dialysis')
  );
}

export function hasBloodOrders(patient: Patient): boolean {
  const haystack = clinicalHaystack(patient);
  return (
    haystack.includes('blood order') ||
    haystack.includes('blood transfusion') ||
    haystack.includes('type and screen') ||
    haystack.includes('type & screen') ||
    haystack.includes('prbc')
  );
}

export function isOccupiedPatient(name: string): boolean {
  return name.trim() !== '' && name !== 'Vacant';
}
