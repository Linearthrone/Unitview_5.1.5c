export const AUDIT_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'SESSION_TIMEOUT',
  'PASSWORD_CHANGE',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DEACTIVATE',
  'USER_ACTIVATE',
  'PHI_VIEW',
  'PHI_EXPORT',
  'PATIENT_ADMIT',
  'PATIENT_DISCHARGE',
  'FHIR_CONNECT',
  'FHIR_CONNECT_FAILURE',
  'FHIR_SYNC',
  'FHIR_SYNC_FAILURE',
  'CONFIG_CHANGE',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEventInput {
  action: AuditAction;
  actorEmployeeNumber?: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  detail?: string;
}

export interface AuditRecord extends AuditEventInput {
  id: string;
  timestamp: string;
}

const PHI_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\bMRN[:\s-]*[A-Za-z0-9-]+\b/gi,
  /\b(?:patient|name)\s*[:=]\s*[^,;]+/gi,
];

export function redactAuditDetail(detail: string | undefined): string | undefined {
  if (detail === undefined) {
    return undefined;
  }
  let redacted = detail;
  for (const pattern of PHI_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted.slice(0, 500);
}

export function createAuditRecord(input: AuditEventInput, now = new Date()): AuditRecord {
  if (!AUDIT_ACTIONS.includes(input.action)) {
    throw new Error('Invalid audit action');
  }
  return {
    id: `aud-${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: now.toISOString(),
    action: input.action,
    actorEmployeeNumber: input.actorEmployeeNumber,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    success: input.success,
    detail: redactAuditDetail(input.detail),
  };
}
