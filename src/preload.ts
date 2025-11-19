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
    ipcRenderer.on('menu-new-layout', () => callback('new-layout'));
    ipcRenderer.on('menu-open-layout', () => callback('open-layout'));
    ipcRenderer.on('menu-save-layout', () => callback('save-layout'));
    ipcRenderer.on('menu-import-data', (event, filePath) => callback('import-data', filePath));
    ipcRenderer.on('menu-export-data', (event, filePath) => callback('export-data', filePath));
    ipcRenderer.on('menu-print-report', () => callback('print-report'));
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
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