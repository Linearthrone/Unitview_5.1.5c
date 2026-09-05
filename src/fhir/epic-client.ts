import { randomUUID, sign } from 'crypto';
import { mapPatientToCensus, referenceId } from './mapper';
import { buildSandboxContexts } from './sandbox-fixtures';
import {
  assertHttpsUrl,
  EPIC_SANDBOX_DEFAULTS,
  normalizeFhirBaseUrl,
  type EpicConnectionConfig,
} from './epic-config';
import type {
  CensusRecord,
  FhirAllergyIntolerance,
  FhirBundle,
  FhirCondition,
  FhirEncounter,
  FhirFlag,
  FhirNutritionOrder,
  FhirPatient,
  FhirResource,
  PatientContext,
} from './types';

export interface FhirConnectionResult {
  ok: boolean;
  fhirVersion?: string;
  tokenEndpoint?: string;
  error?: string;
}

export interface FhirCensusResult {
  records: CensusRecord[];
  source: 'epic' | 'sandbox_fixtures';
  fetchedAt: string;
}

interface SmartConfiguration {
  token_endpoint?: string;
  capabilities?: string[];
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

const DEFAULT_SCOPES = EPIC_SANDBOX_DEFAULTS.scopes;

function signBackendAssertion(config: EpicConnectionConfig, tokenUrl: string): string {
  if (!config.clientId) {
    throw new Error('Epic client ID is required');
  }
  if (!config.privateKeyPem) {
    throw new Error('Epic private key is required for backend services');
  }
  const now = Math.floor(Date.now() / 1000);
  const header: Record<string, string> = { alg: 'RS384', typ: 'JWT' };
  if (config.keyId) header.kid = config.keyId;
  const payload = {
    iss: config.clientId,
    sub: config.clientId,
    aud: tokenUrl,
    jti: randomUUID(),
    iat: now,
    exp: now + 4 * 60,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = sign('RSA-SHA384', Buffer.from(unsigned), config.privateKeyPem);
  return `${unsigned}.${signature.toString('base64url')}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Epic FHIR returned a non-JSON response (${response.status})`);
  }
}

function sanitizeHttpError(status: number, body: TokenResponse | undefined): string {
  if (body?.error_description) return `Epic token error: ${body.error_description}`;
  if (body?.error) return `Epic token error: ${body.error}`;
  return `Epic FHIR request failed (${status})`;
}

export async function discoverSmartConfiguration(
  fhirBaseUrl: string
): Promise<SmartConfiguration> {
  const base = normalizeFhirBaseUrl(fhirBaseUrl);
  assertHttpsUrl(base, 'FHIR base URL');
  const response = await fetch(`${base}/.well-known/smart-configuration`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Could not load SMART configuration (${response.status})`);
  }
  return readJson<SmartConfiguration>(response);
}

export async function requestBackendAccessToken(
  config: EpicConnectionConfig
): Promise<{ accessToken: string; tokenEndpoint: string }> {
  const tokenUrl = config.tokenUrl || EPIC_SANDBOX_DEFAULTS.tokenUrl;
  assertHttpsUrl(tokenUrl, 'Token URL');
  const assertion = signBackendAssertion(config, tokenUrl);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
    scope: config.scopes || DEFAULT_SCOPES,
  });
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  });
  const parsed = await readJson<TokenResponse>(response);
  if (!response.ok || !parsed.access_token) {
    throw new Error(sanitizeHttpError(response.status, parsed));
  }
  return { accessToken: parsed.access_token, tokenEndpoint: tokenUrl };
}

async function fhirGet<T extends FhirResource>(
  config: EpicConnectionConfig,
  accessToken: string,
  pathAndQuery: string
): Promise<T> {
  const base = normalizeFhirBaseUrl(config.fhirBaseUrl);
  assertHttpsUrl(base, 'FHIR base URL');
  const url = `${base}/${pathAndQuery.replace(/^\//, '')}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/fhir+json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Epic FHIR request failed (${response.status})`);
  }
  return readJson<T>(response);
}

function bundleResources<T extends FhirResource>(bundle: FhirBundle, resourceType: T['resourceType']): T[] {
  return (bundle.entry ?? [])
    .map((entry) => entry.resource)
    .filter((resource): resource is T => Boolean(resource && resource.resourceType === resourceType));
}

async function searchByPatient<T extends FhirResource>(
  config: EpicConnectionConfig,
  accessToken: string,
  resourceType: T['resourceType'],
  patientId: string
): Promise<T[]> {
  const bundle = await fhirGet<FhirBundle>(
    config,
    accessToken,
    `${resourceType}?patient=${encodeURIComponent(patientId)}`
  );
  return bundleResources<T>(bundle, resourceType);
}

function encounterSearchPath(config: EpicConnectionConfig): string {
  const params = new URLSearchParams({
    status: 'in-progress',
    _include: 'Encounter:patient',
  });
  if (config.locationId) {
    params.set('location', config.locationId);
  }
  return `Encounter?${params.toString()}`;
}

export async function fetchEpicCensus(config: EpicConnectionConfig): Promise<FhirCensusResult> {
  if (config.authMode === 'sandbox_fixtures') {
    const now = new Date();
    return {
      records: buildSandboxContexts().map((ctx) => mapPatientToCensus(ctx, { now, mrnSystem: config.mrnSystem })),
      source: 'sandbox_fixtures',
      fetchedAt: now.toISOString(),
    };
  }

  const { accessToken } = await requestBackendAccessToken(config);
  const encounterBundle = await fhirGet<FhirBundle>(config, accessToken, encounterSearchPath(config));
  const encounters = bundleResources<FhirEncounter>(encounterBundle, 'Encounter').filter(
    (encounter) => encounter.status === 'in-progress'
  );
  const patientsById = new Map<string, FhirPatient>();
  for (const patient of bundleResources<FhirPatient>(encounterBundle, 'Patient')) {
    if (patient.id) patientsById.set(patient.id, patient);
  }

  const contexts: PatientContext[] = [];
  for (const encounter of encounters) {
    const patientId = referenceId(encounter.subject?.reference);
    if (!patientId) continue;
    let patient = patientsById.get(patientId);
    if (!patient) {
      patient = await fhirGet<FhirPatient>(config, accessToken, `Patient/${encodeURIComponent(patientId)}`);
    }
    const [flags, conditions, nutritionOrders, allergies] = await Promise.all([
      searchByPatient<FhirFlag>(config, accessToken, 'Flag', patientId),
      searchByPatient<FhirCondition>(config, accessToken, 'Condition', patientId),
      searchByPatient<FhirNutritionOrder>(config, accessToken, 'NutritionOrder', patientId),
      searchByPatient<FhirAllergyIntolerance>(config, accessToken, 'AllergyIntolerance', patientId),
    ]);
    contexts.push({ patient, encounter, flags, conditions, nutritionOrders, allergies });
  }

  const now = new Date();
  return {
    records: contexts.map((ctx) => mapPatientToCensus(ctx, { now, mrnSystem: config.mrnSystem })),
    source: 'epic',
    fetchedAt: now.toISOString(),
  };
}

export async function testEpicConnection(config: EpicConnectionConfig): Promise<FhirConnectionResult> {
  try {
    if (config.authMode === 'sandbox_fixtures') {
      return { ok: true, fhirVersion: 'R4-sandbox-fixtures' };
    }
    assertHttpsUrl(config.fhirBaseUrl, 'FHIR base URL');
    const smart = await discoverSmartConfiguration(config.fhirBaseUrl);
    const tokenEndpoint = smart.token_endpoint || config.tokenUrl;
    await requestBackendAccessToken({ ...config, tokenUrl: tokenEndpoint || config.tokenUrl });
    return {
      ok: true,
      fhirVersion: 'R4',
      tokenEndpoint,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Epic connection failed',
    };
  }
}
