export {};

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

interface AuditEventInput {
  action: AuditAction;
  actorEmployeeNumber?: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  detail?: string;
}

interface EpicConnectionPublic {
  fhirBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  keyId?: string;
  scopes: string;
  locationId?: string;
  locationName?: string;
  mrnSystem: string;
  authMode: 'backend_services' | 'sandbox_fixtures';
  configured: boolean;
}

interface CensusRecord {
  fhirPatientId: string;
  fhirEncounterId?: string;
  mrn?: string;
  name: string;
  age: number;
  gender?: 'Male' | 'Female';
  admitDate: string;
  dischargeDate?: string;
  chiefComplaint: string;
  roomHint: string;
  diet: string;
  mobility: 'Bed Rest' | 'Assisted' | 'Independent';
  codeStatus: 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
  orientationStatus: 'x1' | 'x2' | 'x3' | 'x4' | 'N/A';
  ldas: string[];
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
  notes?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      exportData: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
      importData: () => Promise<{ success: boolean; data?: unknown; error?: string }>;
      printToPDF: (htmlContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      getAppVersion: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      saveSecureStore: (plaintext: string) => Promise<{ success: boolean; error?: string }>;
      loadSecureStore: () => Promise<{
        success: boolean;
        data?: string | null;
        exists?: boolean;
        error?: string;
      }>;
      getHipaaStatus: () => Promise<{
        encryptionAtRest: boolean;
        osKeychain: boolean;
        tlsRequired: boolean;
        sessionTimeoutMinutes: number;
      }>;
      recordAudit: (input: AuditEventInput) => Promise<{ success: boolean; error?: string }>;
      listAudit: (maxLines?: number) => Promise<{ success: boolean; records?: AuditEventInput[]; error?: string }>;
      getEpicConfig: () => Promise<EpicConnectionPublic>;
      saveEpicConfig: (
        config: Partial<EpicConnectionPublic> & { privateKeyPem?: string; actorEmployeeNumber?: string }
      ) => Promise<{ success: boolean; config?: EpicConnectionPublic; error?: string }>;
      testEpicConnection: (actorEmployeeNumber?: string) => Promise<{
        ok: boolean;
        fhirVersion?: string;
        tokenEndpoint?: string;
        error?: string;
      }>;
      fetchEpicCensus: (actorEmployeeNumber?: string) => Promise<{
        success: boolean;
        records?: CensusRecord[];
        source?: 'epic' | 'sandbox_fixtures';
        fetchedAt?: string;
        error?: string;
      }>;
      onMenuAction: (callback: (action: string, data?: string) => void) => () => void;
    };
  }
}
