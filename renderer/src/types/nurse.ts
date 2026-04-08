
import type { StaffRole } from "./patient";

export type SpectraStatus =
  | "in service"
  | "out of service"
  | "lost"
  | "damaged"
  | "being repaired";

export interface SpectraLogEntry {
  id: string;
  createdAt: string;
  message: string;
}

export interface Spectra {
  id: string; // The spectra number itself, e.g., "SPEC-1234"
  inService: boolean;
  status?: SpectraStatus;
  assignedTo?: string;
  logs?: SpectraLogEntry[];
}

export interface Nurse {
  id: string;
  name: string;
  role: StaffRole;
  spectra?: string;
  relief?: string;
  assignedPatientIds: (string | null)[];
  gridRow: number;
  gridColumn: number;
}

export interface PatientCareTech {
    id: string;
    name: string;
    spectra: string;
    assignmentGroup: string;
    gridRow: number;
    gridColumn: number;
}
