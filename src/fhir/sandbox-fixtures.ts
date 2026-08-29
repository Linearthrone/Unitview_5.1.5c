import type {
  FhirAllergyIntolerance,
  FhirCondition,
  FhirEncounter,
  FhirFlag,
  FhirNutritionOrder,
  FhirPatient,
  PatientContext,
} from './types';

const MRN_SYSTEM = 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384';

export const SANDBOX_PATIENTS: FhirPatient[] = [
  {
    resourceType: 'Patient',
    id: 'erXuFYUfucBZaryVksYEcMg3',
    identifier: [{ system: MRN_SYSTEM, value: '203713', type: { coding: [{ code: 'MR' }] } }],
    name: [{ use: 'official', family: 'Lopez', given: ['Camila'] }],
    gender: 'female',
    birthDate: '1987-04-12',
  },
  {
    resourceType: 'Patient',
    id: 'eq081-VQEgP8drUUqCWzHfw3',
    identifier: [{ system: MRN_SYSTEM, value: '202916', type: { coding: [{ code: 'MR' }] } }],
    name: [{ use: 'official', family: 'Lin', given: ['Derrick'] }],
    gender: 'male',
    birthDate: '1964-09-01',
  },
  {
    resourceType: 'Patient',
    id: 'eIXesllypH3M9tAA5WdJftQ3',
    identifier: [{ system: MRN_SYSTEM, value: '202540', type: { coding: [{ code: 'MR' }] } }],
    name: [{ use: 'official', family: 'Roberts', given: ['Elijah'] }],
    gender: 'male',
    birthDate: '1958-11-22',
  },
];

export const SANDBOX_ENCOUNTERS: FhirEncounter[] = [
  {
    resourceType: 'Encounter',
    id: 'eEnc-812',
    status: 'in-progress',
    subject: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
    period: { start: '2026-08-20T14:05:00Z' },
    reasonCode: [{ text: 'Community-acquired pneumonia' }],
    location: [{ location: { display: 'Room 812' } }],
  },
  {
    resourceType: 'Encounter',
    id: 'eEnc-813',
    status: 'in-progress',
    subject: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
    period: { start: '2026-08-18T07:40:00Z' },
    reasonCode: [{ text: 'CHF exacerbation' }],
    location: [{ location: { display: 'Room 813' } }],
  },
  {
    resourceType: 'Encounter',
    id: 'eEnc-814',
    status: 'in-progress',
    subject: { reference: 'Patient/eIXesllypH3M9tAA5WdJftQ3' },
    period: { start: '2026-08-22T03:15:00Z' },
    reasonCode: [{ text: 'Sepsis, unknown source' }],
    location: [{ location: { display: 'Room 814' } }],
  },
];

export const SANDBOX_FLAGS: FhirFlag[] = [
  {
    resourceType: 'Flag',
    status: 'active',
    code: { text: 'Fall risk' },
    subject: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
  },
  {
    resourceType: 'Flag',
    status: 'active',
    code: { text: 'Contact isolation' },
    subject: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
  },
  {
    resourceType: 'Flag',
    status: 'active',
    code: { text: 'DNR / Comfort care' },
    subject: { reference: 'Patient/eIXesllypH3M9tAA5WdJftQ3' },
  },
];

export const SANDBOX_CONDITIONS: FhirCondition[] = [
  {
    resourceType: 'Condition',
    code: { text: 'Foley catheter in place' },
    subject: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
  },
  {
    resourceType: 'Condition',
    code: { text: 'Assisted mobility, walker' },
    subject: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
  },
];

export const SANDBOX_NUTRITION: FhirNutritionOrder[] = [
  {
    resourceType: 'NutritionOrder',
    status: 'active',
    patient: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3' },
    oralDiet: { instruction: 'Cardiac, thin liquids' },
  },
  {
    resourceType: 'NutritionOrder',
    status: 'active',
    patient: { reference: 'Patient/eq081-VQEgP8drUUqCWzHfw3' },
    oralDiet: { instruction: '2g sodium' },
  },
];

export const SANDBOX_ALLERGIES: FhirAllergyIntolerance[] = [
  {
    resourceType: 'AllergyIntolerance',
    patient: { reference: 'Patient/eIXesllypH3M9tAA5WdJftQ3' },
    code: { text: 'Penicillin' },
  },
];

export function buildSandboxContexts(): PatientContext[] {
  return SANDBOX_PATIENTS.map((patient) => {
    const id = patient.id ?? '';
    return {
      patient,
      encounter: SANDBOX_ENCOUNTERS.find((enc) => enc.subject?.reference?.endsWith(id)),
      flags: SANDBOX_FLAGS.filter((flag) => flag.subject?.reference?.endsWith(id)),
      conditions: SANDBOX_CONDITIONS.filter((condition) => condition.subject?.reference?.endsWith(id)),
      nutritionOrders: SANDBOX_NUTRITION.filter((order) => order.patient?.reference?.endsWith(id)),
      allergies: SANDBOX_ALLERGIES.filter((allergy) => allergy.patient?.reference?.endsWith(id)),
    };
  });
}
