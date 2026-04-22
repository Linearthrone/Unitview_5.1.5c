export {};

declare global {
  interface Window {
    electronAPI?: {
      exportData: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
      importData: () => Promise<{ success: boolean; data?: unknown; error?: string }>;
      printToPDF: (htmlContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      getAppVersion: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      onMenuAction: (callback: (action: string, data?: string) => void) => () => void;
    };
  }
}
