import { contextBridge, ipcRenderer } from 'electron';
import type { AuditEventInput } from './security/audit';
import type { EpicConnectionPublic, FhirAuthMode } from './fhir/epic-config';

export interface EpicConfigSaveInput extends Partial<EpicConnectionPublic> {
  privateKeyPem?: string;
  actorEmployeeNumber?: string;
  authMode?: FhirAuthMode;
}

export const electronAPI = {
  exportData: (data: unknown) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  printToPDF: (htmlContent: string) => ipcRenderer.invoke('print-to-pdf', htmlContent),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  saveSecureStore: (plaintext: string) => ipcRenderer.invoke('secure-store-save', plaintext),
  loadSecureStore: () => ipcRenderer.invoke('secure-store-load'),
  getHipaaStatus: () => ipcRenderer.invoke('hipaa-status'),
  recordAudit: (input: AuditEventInput) => ipcRenderer.invoke('audit-record', input),
  listAudit: (maxLines?: number) => ipcRenderer.invoke('audit-list', maxLines),
  getEpicConfig: () => ipcRenderer.invoke('epic-get-config'),
  saveEpicConfig: (config: EpicConfigSaveInput) => ipcRenderer.invoke('epic-save-config', config),
  testEpicConnection: (actorEmployeeNumber?: string) =>
    ipcRenderer.invoke('epic-test-connection', actorEmployeeNumber),
  fetchEpicCensus: (actorEmployeeNumber?: string) =>
    ipcRenderer.invoke('epic-fetch-census', actorEmployeeNumber),
  onMenuAction: (callback: (action: string, data?: string) => void) => {
    const onNewLayout = () => callback('new-layout');
    const onOpenLayout = () => callback('open-layout');
    const onSaveLayout = () => callback('save-layout');
    const onImportData = (_event: unknown, filePath?: string) => callback('import-data', filePath);
    const onExportData = (_event: unknown, filePath?: string) => callback('export-data', filePath);
    const onPrintReport = () => callback('print-report');

    ipcRenderer.on('menu-new-layout', onNewLayout);
    ipcRenderer.on('menu-open-layout', onOpenLayout);
    ipcRenderer.on('menu-save-layout', onSaveLayout);
    ipcRenderer.on('menu-import-data', onImportData);
    ipcRenderer.on('menu-export-data', onExportData);
    ipcRenderer.on('menu-print-report', onPrintReport);

    return () => {
      ipcRenderer.removeListener('menu-new-layout', onNewLayout);
      ipcRenderer.removeListener('menu-open-layout', onOpenLayout);
      ipcRenderer.removeListener('menu-save-layout', onSaveLayout);
      ipcRenderer.removeListener('menu-import-data', onImportData);
      ipcRenderer.removeListener('menu-export-data', onExportData);
      ipcRenderer.removeListener('menu-print-report', onPrintReport);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
