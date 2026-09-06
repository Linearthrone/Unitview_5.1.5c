import type {
  CensusCodeStatus,
  CensusGender,
  CensusMobility,
  CensusRecord,
  FhirCodeableConcept,
  FhirEncounter,
  FhirHumanName,
  FhirIdentifier,
  FhirPatient,
  PatientContext,
} from './types';

const DEFAULT_MRN_SYSTEM = 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384';

export function conceptText(concept: FhirCodeableConcept | undefined): string {
  if (!concept) return '';
  if (concept.text && concept.text.trim()) return concept.text.trim();
  const display = concept.coding?.find((c) => c.display)?.display;
  if (display) return display.trim();
  const code = concept.coding?.find((c) => c.code)?.code;
  return code?.trim() ?? '';
}

export function formatPatientName(names: FhirHumanName[] | undefined): string {
  if (!names || names.length === 0) return 'Unknown';
  const preferred =
    names.find((n) => n.use === 'official') ??
    names.find((n) => n.use === 'usual') ??
    names[0];
  if (!preferred) return 'Unknown';
  if (preferred.text && preferred.text.trim()) return preferred.text.trim();
  const given = (preferred.given ?? []).join(' ').trim();
  const family = (preferred.family ?? '').trim();
  const combined = `${given} ${family}`.trim();
  return combined || 'Unknown';
}

export function calculateAgeYears(birthDate: string, now: Date): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return 0;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return 0;
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() + 1 - month;
  const dayDiff = now.getUTCDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age < 0 ? 0 : age;
}

export function mapGender(gender: FhirPatient['gender']): CensusGender | undefined {
  if (gender === 'male') return 'Male';
  if (gender === 'female') return 'Female';
  return undefined;
}

export function extractMrn(
  identifiers: FhirIdentifier[] | undefined,
  mrnSystem = DEFAULT_MRN_SYSTEM
): string | undefined {
  if (!identifiers) return undefined;
  const bySystem = identifiers.find((id) => id.system === mrnSystem && id.value);
  if (bySystem?.value) return bySystem.value;
  const byType = identifiers.find((id) => {
    const codes = id.type?.coding?.map((c) => c.code) ?? [];
    return codes.includes('MR') && Boolean(id.value);
  });
  return byType?.value;
}

export function extractRoomHint(encounter: FhirEncounter | undefined): string {
  if (!encounter?.location?.length) return '';
  const display = encounter.location
    .map((loc) => loc.location?.display ?? '')
    .find((value) => value.trim().length > 0);
  return display?.trim() ?? '';
}

export function mapCodeStatus(haystack: string): CensusCodeStatus {
  const text = haystack.toLowerCase();
  const hasDnr = text.includes('dnr') || text.includes('do not resuscitate');
  const hasDni = text.includes('dni') || text.includes('do not intubate');
  if (hasDnr && hasDni) return 'DNR/DNI';
  if (hasDnr) return 'DNR';
  if (hasDni) return 'DNI';
  return 'Full Code';
}

export function mapMobility(haystack: string): CensusMobility {
  const text = haystack.toLowerCase();
  if (text.includes('bed rest') || text.includes('bedbound') || text.includes('bed bound')) {
    return 'Bed Rest';
  }
  if (text.includes('assist') || text.includes('standby') || text.includes('walker')) {
    return 'Assisted';
  }
  return 'Independent';
}

export function extractLdas(haystack: string): string[] {
  const text = haystack.toLowerCase();
  const found: string[] = [];
  const checks: Array<[RegExp, string]> = [
    [/\bfoley\b/, 'Foley'],
    [/\bpicc\b/, 'PICC'],
    [/\bcvc\b|\bcentral line\b/, 'Central line'],
    [/\btrach/, 'Trach'],
    [/\bngt\b|\bng tube\b|\bnaso/, 'NGT'],
    [/\bpeg\b/, 'PEG'],
    [/\bchest tube\b/, 'Chest tube'],
    [/\bjp drain\b|\bjackson[- ]pratt\b/, 'JP drain'],
  ];
  for (const [pattern, label] of checks) {
    if (pattern.test(text)) found.push(label);
  }
  return found;
}

function combinedClinicalText(ctx: PatientContext): string {
  const parts: string[] = [];
  if (ctx.encounter?.reasonCode) {
    for (const reason of ctx.encounter.reasonCode) {
      parts.push(conceptText(reason));
    }
  }
  for (const flag of ctx.flags ?? []) {
    parts.push(conceptText(flag.code));
  }
  for (const condition of ctx.conditions ?? []) {
    parts.push(conceptText(condition.code));
  }
  for (const allergy of ctx.allergies ?? []) {
    parts.push(conceptText(allergy.code));
  }
  for (const order of ctx.nutritionOrders ?? []) {
    parts.push(order.oralDiet?.instruction ?? '');
    for (const dietType of order.oralDiet?.type ?? []) {
      parts.push(conceptText(dietType));
    }
  }
  return parts.filter(Boolean).join(' | ');
}

function flagIncludes(ctx: PatientContext, needles: string[]): boolean {
  const haystack = (ctx.flags ?? [])
    .map((flag) => conceptText(flag.code).toLowerCase())
    .join(' | ');
  return needles.some((needle) => haystack.includes(needle));
}

export function referenceId(reference: string | undefined): string | undefined {
  if (!reference) return undefined;
  const parts = reference.split('/');
  return parts[parts.length - 1] || undefined;
}

export function mapPatientToCensus(
  ctx: PatientContext,
  options?: { now?: Date; mrnSystem?: string }
): CensusRecord {
  const patient = ctx.patient;
  if (!patient.id) {
    throw new Error('FHIR Patient is missing an id');
  }
  const now = options?.now ?? new Date();
  const haystack = combinedClinicalText(ctx);
  const chiefComplaint =
    ctx.encounter?.reasonCode?.map((reason) => conceptText(reason)).find(Boolean) ??
    ctx.conditions?.map((condition) => conceptText(condition.code)).find(Boolean) ??
    'N/A';
  const diet =
    ctx.nutritionOrders
      ?.map((order) => order.oralDiet?.instruction || conceptText(order.oralDiet?.type?.[0]))
      .find((value) => value && value.trim()) ?? 'N/A';
  const codeStatus = mapCodeStatus(haystack);
  const isolation = flagIncludes(ctx, ['isolation', 'contact', 'airborne', 'droplet', 'precaution']);
  const comfort = /comfort care/.test(haystack.toLowerCase());

  return {
    fhirPatientId: patient.id,
    fhirEncounterId: ctx.encounter?.id,
    mrn: extractMrn(patient.identifier, options?.mrnSystem),
    name: formatPatientName(patient.name),
    age: patient.birthDate ? calculateAgeYears(patient.birthDate, now) : 0,
    gender: mapGender(patient.gender),
    admitDate: ctx.encounter?.period?.start ?? now.toISOString(),
    dischargeDate: ctx.encounter?.period?.end,
    chiefComplaint,
    roomHint: extractRoomHint(ctx.encounter),
    diet,
    mobility: mapMobility(haystack),
    codeStatus,
    orientationStatus: 'N/A',
    ldas: extractLdas(haystack),
    isFallRisk: flagIncludes(ctx, ['fall']),
    isSeizureRisk: flagIncludes(ctx, ['seizure']),
    isAspirationRisk: flagIncludes(ctx, ['aspiration']),
    isIsolation: isolation,
    isInRestraints: flagIncludes(ctx, ['restraint']),
    isComfortCareDNR: comfort || codeStatus !== 'Full Code',
    notes: haystack || undefined,
  };
}
