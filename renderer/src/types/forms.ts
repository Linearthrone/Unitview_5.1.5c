
"use client";

import * as z from 'zod';
import type { MobilityStatus, PatientGender, CodeStatus, OrientationStatus, StaffRole, Patient } from '@/types/patient';

// From admit-patient-dialog.tsx
export const MOBILITY_STATUSES: MobilityStatus[] = ['Bed Rest', 'Assisted', 'Independent'];
export const GENDERS: PatientGender[] = ['Male', 'Female'];
export const CODE_STATUSES: CodeStatus[] = ['Full Code', 'DNR', 'DNI', 'DNR/DNI'];
export const DIETS = [
    "Regular", "NPO (Nothing by mouth)", "Cardiac Diet", "Diabetic Diet (ADA)", "Renal Diet", "Clear Liquids",
    "Full Liquids", "Mechanical Soft", "Pureed"
];
export const ORIENTATION_STATUSES: OrientationStatus[] = ['x1', 'x2', 'x3', 'x4'];

export const AdmitPatientFormSchema = z.object({
  bedNumber: z.coerce.number().min(1, "Bed number is required."),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0, "Age must be a positive number.").max(130),
  gender: z.enum(GENDERS as [PatientGender, ...PatientGender[]]),
  chiefComplaint: z.string().min(1, "Chief complaint is required."),
  admitDate: z.date(),
  dischargeDate: z.date(),
  ldas: z.string().optional(),
  notes: z.string().optional(),
  pendingProcedures: z.string().optional(),
  diet: z.string().min(1, "Diet is required."),
  mobility: z.enum(MOBILITY_STATUSES as [MobilityStatus, ...MobilityStatus[]]),
  codeStatus: z.enum(CODE_STATUSES as [CodeStatus, ...CodeStatus[]]),
  orientationStatus: z.enum(ORIENTATION_STATUSES as [OrientationStatus, ...OrientationStatus[]]),
  assignedNurse: z.string().min(1, "Nurse assignment is required."),
  isFallRisk: z.boolean().default(false),
  isSeizureRisk: z.boolean().default(false),
  isAspirationRisk: z.boolean().default(false),
  isIsolation: z.boolean().default(false),
  isInRestraints: z.boolean().default(false),
  isComfortCareDNR: z.boolean().default(false),
  isInvoluntaryHold1013: z.boolean().default(false),
  requiresSitter: z.boolean().default(false),
});

export type AdmitPatientFormValues = z.infer<typeof AdmitPatientFormSchema>;

const ORIENTATION_SET = new Set<string>(ORIENTATION_STATUSES);

/** Coerce persisted JSON dates into Date instances for forms and zod. */
export function toPatientDate(value: Date | string | number | unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/** Map a stored patient row into validated admit/update form values. */
export function patientToAdmitFormValues(patient: Patient): AdmitPatientFormValues {
  const orientation = ORIENTATION_SET.has(patient.orientationStatus)
    ? (patient.orientationStatus as (typeof ORIENTATION_STATUSES)[number])
    : 'x4';

  return {
    bedNumber: patient.bedNumber,
    name: patient.name,
    age: patient.age,
    gender: patient.gender ?? 'Male',
    chiefComplaint:
      patient.chiefComplaint && patient.chiefComplaint !== 'N/A' ? patient.chiefComplaint : 'See chart',
    admitDate: toPatientDate(patient.admitDate),
    dischargeDate: toPatientDate(patient.dischargeDate),
    ldas: Array.isArray(patient.ldas) ? patient.ldas.join(', ') : '',
    notes: patient.notes ?? '',
    pendingProcedures: patient.pendingProcedures ?? '',
    diet: patient.diet && patient.diet !== 'N/A' ? patient.diet : 'Regular',
    mobility: patient.mobility ?? 'Independent',
    codeStatus: patient.codeStatus ?? 'Full Code',
    orientationStatus: orientation,
    assignedNurse: patient.assignedNurse || 'To Be Assigned',
    isFallRisk: Boolean(patient.isFallRisk),
    isSeizureRisk: Boolean(patient.isSeizureRisk),
    isAspirationRisk: Boolean(patient.isAspirationRisk),
    isIsolation: Boolean(patient.isIsolation),
    isInRestraints: Boolean(patient.isInRestraints),
    isComfortCareDNR: Boolean(patient.isComfortCareDNR),
    isInvoluntaryHold1013: Boolean(patient.isInvoluntaryHold1013),
    requiresSitter: Boolean(patient.requiresSitter),
  };
}


// From add-staff-member-dialog.tsx
export const STAFF_ROLES: StaffRole[] = [
    'Staff Nurse', 'Charge Nurse', 'Float Pool Nurse', 
    'Unit Clerk', 'Patient Care Tech', 'Sitter'
];

export const AddStaffMemberFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  role: z.enum(STAFF_ROLES as [StaffRole, ...StaffRole[]]),
  relief: z.string().optional(),
  spectra: z.string().optional(),
});

export type AddStaffMemberFormValues = z.infer<typeof AddStaffMemberFormSchema>;
