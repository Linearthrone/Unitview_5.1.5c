export type FhirGender = 'male' | 'female' | 'other' | 'unknown';

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirReference {
  reference?: string;
  display?: string;
}

export interface FhirHumanName {
  use?: string;
  family?: string;
  given?: string[];
  text?: string;
}

export interface FhirIdentifier {
  use?: string;
  system?: string;
  value?: string;
  type?: FhirCodeableConcept;
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: FhirIdentifier[];
  name?: FhirHumanName[];
  gender?: FhirGender;
  birthDate?: string;
}

export interface FhirEncounterLocation {
  location?: FhirReference;
}

export interface FhirEncounter {
  resourceType: 'Encounter';
  id?: string;
  status?: string;
  subject?: FhirReference;
  period?: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
  location?: FhirEncounterLocation[];
}

export interface FhirFlag {
  resourceType: 'Flag';
  id?: string;
  status?: string;
  code?: FhirCodeableConcept;
  subject?: FhirReference;
}

export interface FhirCondition {
  resourceType: 'Condition';
  id?: string;
  code?: FhirCodeableConcept;
  subject?: FhirReference;
  clinicalStatus?: FhirCodeableConcept;
}

export interface FhirNutritionOrder {
  resourceType: 'NutritionOrder';
  id?: string;
  status?: string;
  patient?: FhirReference;
  oralDiet?: {
    type?: FhirCodeableConcept[];
    instruction?: string;
  };
}

export interface FhirAllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  id?: string;
  patient?: FhirReference;
  code?: FhirCodeableConcept;
  clinicalStatus?: FhirCodeableConcept;
}

export interface FhirBundleEntry {
  resource?: FhirResource;
}

export interface FhirBundle {
  resourceType: 'Bundle';
  type?: string;
  entry?: FhirBundleEntry[];
}

export type FhirResource =
  | FhirPatient
  | FhirEncounter
  | FhirFlag
  | FhirCondition
  | FhirNutritionOrder
  | FhirAllergyIntolerance
  | FhirBundle;

export type CensusGender = 'Male' | 'Female';
export type CensusMobility = 'Bed Rest' | 'Assisted' | 'Independent';
export type CensusCodeStatus = 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
export type CensusOrientation = 'x1' | 'x2' | 'x3' | 'x4' | 'N/A';

export interface CensusRecord {
  fhirPatientId: string;
  fhirEncounterId?: string;
  mrn?: string;
  name: string;
  age: number;
  gender?: CensusGender;
  admitDate: string;
  dischargeDate?: string;
  chiefComplaint: string;
  roomHint: string;
  diet: string;
  mobility: CensusMobility;
  codeStatus: CensusCodeStatus;
  orientationStatus: CensusOrientation;
  ldas: string[];
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
  notes?: string;
}

export interface PatientContext {
  patient: FhirPatient;
  encounter?: FhirEncounter;
  flags?: FhirFlag[];
  conditions?: FhirCondition[];
  nutritionOrders?: FhirNutritionOrder[];
  allergies?: FhirAllergyIntolerance[];
}
