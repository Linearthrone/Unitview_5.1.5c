import { ipcMain } from 'electron';
import Store from 'electron-store';
import { createAuditRecord, type AuditEventInput } from '../security/audit';
import {
  EPIC_SANDBOX_DEFAULTS,
  publicEpicConfig,
  type EpicConnectionConfig,
  type EpicConnectionPublic,
  type FhirAuthMode,
} from '../fhir/epic-config';
import { fetchEpicCensus, testEpicConnection } from '../fhir/epic-client';
import {
  appendAuditLine,
  loadEpicSecrets,
  loadVault,
  readAuditLines,
  saveEpicSecrets,
  saveVault,
  vaultExists,
  vaultUsesOsKeychain,
} from './secure-vault';

const store = new Store<{ epic: EpicConnectionPublic }>({
  name: 'unitview-secure-settings',
  defaults: { epic: { ...EPIC_SANDBOX_DEFAULTS } },
});

function currentEpicConfig(): EpicConnectionConfig {
  const publicConfig = { ...EPIC_SANDBOX_DEFAULTS, ...store.get('epic') };
  const secrets = loadEpicSecrets();
  return { ...publicConfig, ...secrets };
}

function writeAudit(input: AuditEventInput): void {
  const record = createAuditRecord(input);
  appendAuditLine(JSON.stringify(record));
}

export function registerIpcHandlers(): void {
  ipcMain.handle('secure-store-save', async (_event, plaintext: unknown) => {
    if (typeof plaintext !== 'string') {
      return { success: false, error: 'Secure store payload must be a string' };
    }
    try {
      saveVault(plaintext);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Save failed' };
    }
  });

  ipcMain.handle('secure-store-load', async () => {
    const exists = vaultExists();
    try {
      return { success: true, data: loadVault(), exists };
    } catch (error) {
      return {
        success: false,
        exists,
        error: error instanceof Error ? error.message : 'Load failed',
      };
    }
  });

  ipcMain.handle('hipaa-status', async () => {
    return {
      encryptionAtRest: true,
      osKeychain: vaultUsesOsKeychain(),
      tlsRequired: true,
      sessionTimeoutMinutes: 15,
    };
  });

  ipcMain.handle('audit-record', async (_event, input: AuditEventInput) => {
    try {
      writeAudit(input);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Audit failed' };
    }
  });

  ipcMain.handle('audit-list', async (_event, maxLines?: number) => {
    try {
      const lines = readAuditLines(typeof maxLines === 'number' ? maxLines : 200);
      return { success: true, records: lines.map((line) => JSON.parse(line)) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Audit read failed' };
    }
  });

  ipcMain.handle('epic-get-config', async () => {
    return publicEpicConfig(currentEpicConfig());
  });

  ipcMain.handle(
    'epic-save-config',
    async (
      _event,
      next: Partial<EpicConnectionPublic> & { privateKeyPem?: string; actorEmployeeNumber?: string }
    ) => {
      try {
        const current = currentEpicConfig();
        const merged: EpicConnectionConfig = {
          ...current,
          fhirBaseUrl: next.fhirBaseUrl ?? current.fhirBaseUrl,
          tokenUrl: next.tokenUrl ?? current.tokenUrl,
          clientId: next.clientId ?? current.clientId,
          keyId: next.keyId ?? current.keyId,
          scopes: next.scopes ?? current.scopes,
          locationId: next.locationId ?? current.locationId,
          locationName: next.locationName ?? current.locationName,
          mrnSystem: next.mrnSystem ?? current.mrnSystem,
          authMode: (next.authMode as FhirAuthMode | undefined) ?? current.authMode,
          privateKeyPem: next.privateKeyPem !== undefined ? next.privateKeyPem : current.privateKeyPem,
        };
        store.set('epic', publicEpicConfig(merged));
        if (next.privateKeyPem !== undefined) {
          saveEpicSecrets({ privateKeyPem: next.privateKeyPem });
        }
        writeAudit({
          action: 'CONFIG_CHANGE',
          actorEmployeeNumber: next.actorEmployeeNumber,
          resourceType: 'EpicFhirConfig',
          success: true,
        });
        return { success: true, config: publicEpicConfig(merged) };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Save failed' };
      }
    }
  );

  ipcMain.handle('epic-test-connection', async (_event, actorEmployeeNumber?: string) => {
    const config = currentEpicConfig();
    const result = await testEpicConnection(config);
    writeAudit({
      action: result.ok ? 'FHIR_CONNECT' : 'FHIR_CONNECT_FAILURE',
      actorEmployeeNumber,
      resourceType: 'EpicFhir',
      success: result.ok,
      detail: result.ok ? result.fhirVersion : result.error,
    });
    return result;
  });

  ipcMain.handle('epic-fetch-census', async (_event, actorEmployeeNumber?: string) => {
    try {
      const result = await fetchEpicCensus(currentEpicConfig());
      writeAudit({
        action: 'FHIR_SYNC',
        actorEmployeeNumber,
        resourceType: 'Encounter',
        success: true,
        detail: `count=${result.records.length};source=${result.source}`,
      });
      return { success: true, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Epic census sync failed';
      writeAudit({
        action: 'FHIR_SYNC_FAILURE',
        actorEmployeeNumber,
        resourceType: 'Encounter',
        success: false,
        detail: message,
      });
      return { success: false, error: message };
    }
  });
}
