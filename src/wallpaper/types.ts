/** Board snapshot pushed from the unit map into the wallpaper renderer. */

export interface WallpaperPatientCell {
  id: string;
  roomDesignation: string;
  /** Empty when redacted or vacant. */
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

export interface WallpaperStartOptions {
  /** Capture interval in ms (clamped 5s–60s). */
  intervalMs?: number;
  /** When true, wallpaper view never shows patient names (default true). */
  redactPhi?: boolean;
  actorEmployeeNumber?: string;
  unitName?: string;
}

export interface WallpaperStatus {
  active: boolean;
  platformSupported: boolean;
  intervalMs: number;
  redactPhi: boolean;
  lastCaptureAt: number | null;
  lastError: string | null;
  imagePath: string | null;
}
