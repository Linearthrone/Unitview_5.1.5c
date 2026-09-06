export type FhirAuthMode = 'backend_services' | 'sandbox_fixtures';

export interface EpicConnectionPublic {
  fhirBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  keyId?: string;
  scopes: string;
  locationId?: string;
  locationName?: string;
  mrnSystem: string;
  authMode: FhirAuthMode;
  configured: boolean;
}

export interface EpicConnectionSecrets {
  privateKeyPem?: string;
}

export interface EpicConnectionConfig extends EpicConnectionPublic, EpicConnectionSecrets {}

export const EPIC_SANDBOX_DEFAULTS: EpicConnectionPublic = {
  fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  clientId: '',
  scopes: [
    'system/Patient.rs',
    'system/Encounter.rs',
    'system/Condition.rs',
    'system/Flag.rs',
    'system/AllergyIntolerance.rs',
    'system/NutritionOrder.rs',
    'system/Location.rs',
  ].join(' '),
  mrnSystem: 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384',
  authMode: 'sandbox_fixtures',
  configured: false,
};

export function normalizeFhirBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function assertHttpsUrl(url: string, label: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${label} must use HTTPS`);
  }
}

export function publicEpicConfig(config: EpicConnectionConfig): EpicConnectionPublic {
  return {
    fhirBaseUrl: config.fhirBaseUrl,
    tokenUrl: config.tokenUrl,
    clientId: config.clientId,
    keyId: config.keyId,
    scopes: config.scopes,
    locationId: config.locationId,
    locationName: config.locationName,
    mrnSystem: config.mrnSystem,
    authMode: config.authMode,
    configured:
      config.authMode === 'sandbox_fixtures' ||
      Boolean(config.clientId && config.privateKeyPem),
  };
}
