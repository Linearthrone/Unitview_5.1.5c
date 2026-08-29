type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'SESSION_TIMEOUT'
  | 'PASSWORD_CHANGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DEACTIVATE'
  | 'USER_ACTIVATE'
  | 'PHI_VIEW'
  | 'PHI_EXPORT'
  | 'PATIENT_ADMIT'
  | 'PATIENT_DISCHARGE'
  | 'FHIR_CONNECT'
  | 'FHIR_CONNECT_FAILURE'
  | 'FHIR_SYNC'
  | 'FHIR_SYNC_FAILURE'
  | 'CONFIG_CHANGE';

export async function recordAudit(input: {
  action: AuditAction;
  actorEmployeeNumber?: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  detail?: string;
}): Promise<void> {
  try {
    if (window.electronAPI?.recordAudit) {
      await window.electronAPI.recordAudit(input);
    }
  } catch {
    // Audit failure must not break clinical workflow
  }
}
