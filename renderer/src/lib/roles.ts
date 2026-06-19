/**
 * Application role model and permission helpers (TASK-20260422-013 Phase 2).
 */

export type AppRole =
  | 'Entity Admin'
  | 'Facility Admin'
  | 'Nurse Manager'
  | 'Charge Nurse'
  | 'Nurse'
  | 'WALLDISPLAY';

export const APP_ROLES: AppRole[] = [
  'Entity Admin',
  'Facility Admin',
  'Nurse Manager',
  'Charge Nurse',
  'Nurse',
  'WALLDISPLAY',
];

/** Legacy auth role stored before appRole migration. */
export type LegacyAuthRole = 'admin' | 'user';

export interface RoleCapabilities {
  appRole: AppRole;
  /** Can create units, rooms, mock data, save layouts, manage device logs. */
  isAdmin: boolean;
  /** Can open Spectra pool management. */
  canManageSpectra: boolean;
  /** Read-only unit view — no edits, no PHI on cards/sheets. */
  isWallDisplay: boolean;
  /** Cannot admit, assign, drag, or open edit flows. */
  isReadOnly: boolean;
  /** May see patient names and identifiers on cards and sheets. */
  canSeePatientIdentifiers: boolean;
}

const ADMIN_ROLES: ReadonlySet<AppRole> = new Set(['Entity Admin', 'Facility Admin']);

const SPECTRA_MANAGER_ROLES: ReadonlySet<AppRole> = new Set([
  'Entity Admin',
  'Facility Admin',
  'Nurse Manager',
  'Charge Nurse',
]);

const PLACEHOLDER_UNASSIGNED = new Set([
  'unassigned',
  'new staff nurse',
  'new float pool nurse',
  'new patient care tech',
]);

/** Map legacy user.role to AppRole when appRole is absent. */
export function resolveAppRole(
  legacyRole: LegacyAuthRole,
  appRole?: AppRole
): AppRole {
  if (appRole) return appRole;
  return legacyRole === 'admin' ? 'Entity Admin' : 'Nurse';
}

export function getRoleCapabilities(
  legacyRole: LegacyAuthRole,
  appRole?: AppRole
): RoleCapabilities {
  const resolved = resolveAppRole(legacyRole, appRole);
  const isAdmin = ADMIN_ROLES.has(resolved);
  const isWallDisplay = resolved === 'WALLDISPLAY';

  return {
    appRole: resolved,
    isAdmin,
    canManageSpectra: SPECTRA_MANAGER_ROLES.has(resolved),
    isWallDisplay,
    isReadOnly: isWallDisplay,
    canSeePatientIdentifiers: !isWallDisplay,
  };
}

export function formatAppRoleLabel(
  legacyRole: LegacyAuthRole,
  appRole?: AppRole
): string {
  return resolveAppRole(legacyRole, appRole);
}

/** Whether a staff card name represents an unassigned placeholder (TASK-20260430-007). */
export function isStaffUnassigned(name: string | undefined | null): boolean {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return true;
  return PLACEHOLDER_UNASSIGNED.has(trimmed.toLowerCase());
}
