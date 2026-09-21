import type { Nurse, PatientCareTech } from '../types/nurse';
import type { Patient } from '../types/patient';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from './grid-utils';

export interface WallpaperPatientCell {
  id: string;
  roomDesignation: string;
  displayName: string;
  isVacant: boolean;
  isBlocked: boolean;
  gridRow: number;
  gridColumn: number;
  isFallRisk: boolean;
  isIsolation: boolean;
  isComfortCareDNR: boolean;
  awaitingTransport: boolean;
  mobility?: string;
}

export interface WallpaperNurseCell {
  id: string;
  name: string;
  spectra?: string;
  gridRow: number;
  gridColumn: number;
  cardRowSpan: number;
  filledSlots: number;
  totalSlots: number;
}

export interface WallpaperTechCell {
  id: string;
  name: string;
  spectra?: string;
  gridRow: number;
  gridColumn: number;
}

export interface WallpaperMapSnapshot {
  unitName: string;
  updatedAt: number;
  redactPhi: boolean;
  cols: number;
  rows: number;
  patients: WallpaperPatientCell[];
  nurses: WallpaperNurseCell[];
  techs: WallpaperTechCell[];
}

export function buildWallpaperSnapshot(input: {
  unitName: string;
  patients: Patient[];
  nurses: Nurse[];
  techs: PatientCareTech[];
  redactPhi: boolean;
  now?: number;
}): WallpaperMapSnapshot {
  const now = input.now ?? Date.now();
  const patients: WallpaperPatientCell[] = input.patients.map((patient) => {
    const isVacant = patient.name === 'Vacant';
    return {
      id: patient.id,
      roomDesignation: patient.roomDesignation,
      displayName: input.redactPhi || isVacant ? '' : patient.name,
      isVacant,
      isBlocked: Boolean(patient.isBlocked),
      gridRow: patient.gridRow,
      gridColumn: patient.gridColumn,
      isFallRisk: Boolean(patient.isFallRisk),
      isIsolation: Boolean(patient.isIsolation),
      isComfortCareDNR: Boolean(patient.isComfortCareDNR),
      awaitingTransport: Boolean(patient.awaitingTransport),
      mobility: isVacant ? undefined : patient.mobility,
    };
  });

  const nurses: WallpaperNurseCell[] = input.nurses.map((nurse) => {
    const totalSlots = nurse.assignedPatientIds.length;
    const filledSlots = nurse.assignedPatientIds.filter((id) => id != null && id !== '').length;
    return {
      id: nurse.id,
      name: nurse.name,
      spectra: nurse.spectra,
      gridRow: nurse.gridRow,
      gridColumn: nurse.gridColumn,
      cardRowSpan: Math.max(1, nurse.cardRowSpan ?? 2),
      filledSlots,
      totalSlots,
    };
  });

  const techs: WallpaperTechCell[] = input.techs.map((tech) => ({
    id: tech.id,
    name: tech.name,
    spectra: tech.spectra,
    gridRow: tech.gridRow,
    gridColumn: tech.gridColumn,
  }));

  return {
    unitName: input.unitName,
    updatedAt: now,
    redactPhi: input.redactPhi,
    cols: NUM_COLS_GRID,
    rows: NUM_ROWS_GRID,
    patients,
    nurses,
    techs,
  };
}

export function isWallpaperMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'wallpaper';
}
