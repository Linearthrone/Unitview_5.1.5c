import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';

// Initialize electron store for app settings
const store = new Store();

class UnitViewApp {
  private mainWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Set application user model id for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.unitview.windows');
    }

    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();
    });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // enableRemoteModule: false, // deprecated
        preload: path.join(__dirname, 'preload.js'),
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });

    // Load the app
    const startUrl = this.isDev 
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      if (this.isDev) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Unit Layout',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-layout');
            },
          },
          {
            label: 'Open Layout',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-layout');
            },
          },
          {
            label: 'Save Layout',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow?.webContents.send('menu-save-layout');
            },
          },
          { type: 'separator' },
          {
            label: 'Import Data',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ['openFile'],
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
              });
              if (!result.canceled && result.filePaths.length > 0) {
                this.mainWindow?.webContents.send('menu-import-data', result.filePaths[0]);
              }
            },
          },
          {
            label: 'Export Data',
            click: async () => {
              const result = await dialog.showSaveDialog(this.mainWindow!, {
                defaultPath: `unitview-backup-${new Date().toISOString().split('T')[0]}.json`,
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
              });
              if (!result.canceled && result.filePath) {
                this.mainWindow?.webContents.send('menu-export-data', result.filePath);
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Print Charge Report',
            accelerator: 'CmdOrCtrl+P',
            click: () => {
              this.mainWindow?.webContents.send('menu-print-report');
            },
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
          { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
          { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
          { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About UnitView',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'About UnitView',
                message: 'UnitView Patient Management Dashboard',
                detail: 'Version 1.0.0\n\nA comprehensive patient management system for hospital charge nurses.\n\nBuilt with Electron, React, and SQLite.',
                buttons: ['OK'],
              });
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Handle data export
    ipcMain.handle('export-data', async (event, data) => {
      try {
        const filePath = await dialog.showSaveDialog(this.mainWindow!, {
          defaultPath: `unitview-backup-${new Date().toISOString().split('T')[0]}.json`,
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (!filePath.canceled && filePath.filePath) {
          fs.writeFileSync(filePath.filePath, JSON.stringify(data, null, 2));
          return { success: true, path: filePath.filePath };
        }
        return { success: false, error: 'Export cancelled' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Handle data import
    ipcMain.handle('import-data', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          properties: ['openFile'],
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const data = fs.readFileSync(result.filePaths[0], 'utf8');
          return { success: true, data: JSON.parse(data) };
        }
        return { success: false, error: 'Import cancelled' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Handle print to PDF
    ipcMain.handle('print-to-pdf', async (event, htmlContent) => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow!, {
          defaultPath: `unitview-report-${new Date().toISOString().split('T')[0]}.pdf`,
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });

        if (!result.canceled && result.filePath) {
          // Create a temporary window for printing
          const printWindow = new BrowserWindow({ show: false });
          await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
          
          const pdfData = await printWindow.webContents.printToPDF({
            printBackground: true,
            margins: { marginType: 'custom', top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
            pageSize: 'Letter',
          });

          fs.writeFileSync(result.filePath, pdfData);
          printWindow.close();
          
          return { success: true, path: result.filePath };
        }
        return { success: false, error: 'Print cancelled' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get app version
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    // Get user data path
    ipcMain.handle('get-user-data-path', () => {
      return app.getPath('userData');
    });
  }
}

// Initialize the application
new UnitViewApp();