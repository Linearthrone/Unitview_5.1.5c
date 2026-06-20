import type { Nurse } from '@/types/nurse';
import type { StaffRole } from '@/types/patient';

export const MIN_NURSE_CARD_ROW_SPAN = 1;
export const MAX_NURSE_CARD_ROW_SPAN = 8;

/** Pixels of vertical drag per one grid row when resizing a nurse card. */
export const NURSE_CARD_ROW_RESIZE_STEP_PX = 36;

export function isAssignableNurseRole(role: StaffRole): boolean {
  return role === 'Staff Nurse' || role === 'Float Pool Nurse';
}

export function clampNurseCardRowSpan(span: number): number {
  return Math.max(MIN_NURSE_CARD_ROW_SPAN, Math.min(MAX_NURSE_CARD_ROW_SPAN, span));
}

/** Default grid row span before the user resizes (matches legacy float-pool footprint). */
export function getDefaultNurseCardRowSpan(role: StaffRole): number {
  return isAssignableNurseRole(role) ? 3 : 1;
}

/** Grid rows spanned by a staff / float pool nurse card on the unit map. */
export function getEffectiveNurseCardRowSpan(nurse: Nurse): number {
  if (typeof nurse.cardRowSpan === 'number') {
    return clampNurseCardRowSpan(nurse.cardRowSpan);
  }
  return getDefaultNurseCardRowSpan(nurse.role);
}

/** @deprecated Use getEffectiveNurseCardRowSpan — row span is independent of patient slot count. */
export function getNurseCardRowSpan(role: StaffRole, _capacity?: number): number {
  return getDefaultNurseCardRowSpan(role);
}

export function getNurseRowSpan(nurse: Nurse): number {
  return getEffectiveNurseCardRowSpan(nurse);
}
