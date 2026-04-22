import { contextBridge, ipcRenderer } from 'electron';

// Define the API for the renderer process
export const electronAPI = {
  // Data operations
  exportData: (data: any) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  
  // Print operations
  printToPDF: (htmlContent: string) => ipcRenderer.invoke('print-to-pdf', htmlContent),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Menu events
  onMenuAction: (callback: (action: string, data?: any) => void) => {
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

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for the renderer process
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}