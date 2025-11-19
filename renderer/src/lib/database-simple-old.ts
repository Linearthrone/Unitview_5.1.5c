// Simplified database implementation for Electron renderer
// This uses a JSON-based storage system that works in the renderer process

import type { Patient, LayoutName, UserPreferences, AssignmentSet } from '../types/patient';
import type { Nurse, PatientCareTech, Spectra } from '../types/nurse';
import type { User, UnitSettings } from '../types/auth';

// Data storage interfaces
interface DatabaseSchema {
  user_preferences: { [key: string]: string };
  layouts: { name: string; created_at: string; updated_at: string }[];
  patients: Patient[];
  nurses: Nurse[];
  patient_care_techs: PatientCareTech[];
  spectra_pool: Spectra[];
  assignment_sets: AssignmentSet[];
}

// In-memory storage with persistence to electron API
export class SimpleDatabase {
  private data: DatabaseSchema = {
    user_preferences: {},
    layouts: [],
    patients: [],
    nurses: [],
    patient_care_techs: [],
    spectra_pool: [],
    assignment_sets: [],
    users: [],
    passwords: {},
    unit_settings: [],
  };

  private isLoaded = false;

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      // Load data from electron main process
      if (window.electronAPI) {
        const userDataPath = await window.electronAPI.getUserDataPath();
        // For now, we'll use localStorage for simplicity
        // In a production app, you'd want to use proper file storage via IPC
        this.loadFromLocalStorage();
      } else {
        // Fallback to localStorage for development
        this.loadFromLocalStorage();
      }
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.initializeWithDefaults();
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('unitview_data');
      if (stored) {
        this.data = JSON.parse(stored);
        // Ensure new fields exist for backward compatibility
        if (!this.data.users) this.data.users = [];
        if (!this.data.passwords) this.data.passwords = {};
        if (!this.data.unit_settings) this.data.unit_settings = [];
        if (!this.data.global_theme) this.data.global_theme = 'light';
        if (!this.data.action_history) this.data.action_history = [];
        if (!this.data.history_index) this.data.history_index = -1;
        // Save updated structure
        this.saveToLocalStorage();
      } else {
        this.initializeWithDefaults();
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      this.initializeWithDefaults();
    }
  }

  private initializeWithDefaults(): void {
    // Initialize with default data
    this.data.user_preferences = {
      lastSelectedLayout: 'North-South View',
      isLayoutLocked: 'false',
    };

    this.data.layouts = [
      {
        name: 'North-South View',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.data.spectra_pool = [
      { id: 'SPEC-1001', inService: true },
      { id: 'SPEC-1002', inService: true },
      { id: 'SPEC-1003', inService: true },
      { id: 'SPEC-1004', inService: true },
      { id: 'SPEC-1005', inService: true },
      { id: 'SPEC-1006', inService: true },
      { id: 'SPEC-1007', inService: true },
      { id: 'SPEC-1008', inService: true },
      { id: 'SPEC-1009', inService: true },
      { id: 'SPEC-1010', inService: true },
      { id: 'SPEC-1011', inService: true },
      { id: 'SPEC-1012', inService: true },
    ];

    // Initialize empty arrays for auth data
    this.data.users = [];
    this.data.passwords = {};
    this.data.unit_settings = [];

    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('unitview_data', JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // User Preferences
  getUserPreferences(): UserPreferences {
    return {
      lastSelectedLayout: this.data.user_preferences.lastSelectedLayout || 'North-South View',
      isLayoutLocked: this.data.user_preferences.isLayoutLocked === 'true',
    };
  }

  saveUserPreferences(preferences: UserPreferences): void {
    this.data.user_preferences.lastSelectedLayout = preferences.lastSelectedLayout;
    this.data.user_preferences.isLayoutLocked = preferences.isLayoutLocked.toString();
    this.saveToLocalStorage();
  }

  // Layouts
  getAvailableLayouts(): LayoutName[] {
    return this.data.layouts.map(layout => layout.name);
  }

  createLayout(layoutName: LayoutName): void {
    if (!this.data.layouts.find(l => l.name === layoutName)) {
      this.data.layouts.push({
        name: layoutName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      this.saveToLocalStorage();
    }
  }

  deleteLayout(layoutName: LayoutName): void {
    this.data.layouts = this.data.layouts.filter(l => l.name !== layoutName);
    // Also remove associated data
    this.data.patients = this.data.patients.filter(p => p.layoutName !== layoutName);
    this.data.nurses = this.data.nurses.filter(n => n.layoutName !== layoutName);
    this.data.patient_care_techs = this.data.patient_care_techs.filter(t => t.layoutName !== layoutName);
    this.data.assignment_sets = this.data.assignment_sets.filter(a => a.layoutName !== layoutName);
    this.saveToLocalStorage();
  }

  // Patients
  getPatients(layoutName: LayoutName): Patient[] {
    return this.data.patients.filter(p => p.layoutName === layoutName);
  }

  savePatients(layoutName: LayoutName, patients: Patient[]): void {
    // Remove existing patients for this layout
    this.data.patients = this.data.patients.filter(p => p.layoutName !== layoutName);
    // Add new patients
    this.data.patients.push(...patients.map(p => ({ ...p, layoutName })));
    this.saveToLocalStorage();
  }

  // Nurses
  getNurses(layoutName: LayoutName): Nurse[] {
    return this.data.nurses.filter(n => n.layoutName === layoutName);
  }

  saveNurses(layoutName: LayoutName, nurses: Nurse[]): void {
    // Remove existing nurses for this layout
    this.data.nurses = this.data.nurses.filter(n => n.layoutName !== layoutName);
    // Add new nurses
    this.data.nurses.push(...nurses.map(n => ({ ...n, layoutName })));
    this.saveToLocalStorage();
  }

  // Techs
  getTechs(layoutName: LayoutName): PatientCareTech[] {
    return this.data.patient_care_techs.filter(t => t.layoutName === layoutName);
  }

  saveTechs(layoutName: LayoutName, techs: PatientCareTech[]): void {
    // Remove existing techs for this layout
    this.data.patient_care_techs = this.data.patient_care_techs.filter(t => t.layoutName !== layoutName);
    // Add new techs
    this.data.patient_care_techs.push(...techs.map(t => ({ ...t, layoutName })));
    this.saveToLocalStorage();
  }

  // Spectra Pool
  getSpectraPool(): Spectra[] {
    return this.data.spectra_pool;
  }

  updateSpectra(spectraId: string, inService: boolean): void {
    const spectra = this.data.spectra_pool.find(s => s.id === spectraId);
    if (spectra) {
      spectra.inService = inService;
      this.saveToLocalStorage();
    }
  }

  addSpectra(spectraId: string): void {
    if (!this.data.spectra_pool.find(s => s.id === spectraId)) {
      this.data.spectra_pool.push({ id: spectraId, inService: true });
      this.saveToLocalStorage();
    }
  }

  removeSpectra(spectraId: string): void {
    this.data.spectra_pool = this.data.spectra_pool.filter(s => s.id !== spectraId);
    this.saveToLocalStorage();
  }

  // Assignment Sets
  getAssignmentSets(layoutName: LayoutName): AssignmentSet[] {
    return this.data.assignment_sets.filter(a => a.layoutName === layoutName);
  }

  saveAssignmentSet(assignmentSet: AssignmentSet): void {
    // Remove existing assignment set with same ID
    this.data.assignment_sets = this.data.assignment_sets.filter(a => a.id !== assignmentSet.id);
    // Add new assignment set
    this.data.assignment_sets.push(assignmentSet);
    this.saveToLocalStorage();
  }

  deleteAssignmentSet(id: string): void {
    this.data.assignment_sets = this.data.assignment_sets.filter(a => a.id !== id);
    this.saveToLocalStorage();
  }

  // Authentication - Users
  getUsers(): User[] {
    return this.data.users || [];
  }

  getUser(id: string): User | undefined {
    return (this.data.users || []).find(u => u.id === id);
  }

  getUserByEmployeeNumber(employeeNumber: string): User | undefined {
    return (this.data.users || []).find(u => u.employeeNumber === employeeNumber);
  }

  saveUser(user: User): void {
    if (!this.data.users) this.data.users = [];
    // Remove existing user with same ID
    this.data.users = this.data.users.filter(u => u.id !== user.id);
    // Add new user
    this.data.users.push(user);
    this.saveToLocalStorage();
  }

  deleteUser(id: string): void {
    if (this.data.users) {
      this.data.users = this.data.users.filter(u => u.id !== id);
      this.saveToLocalStorage();
    }
  }

  // Authentication - Passwords
  getPassword(employeeNumber: string): string | undefined {
    return (this.data.passwords || {})[employeeNumber];
  }

  savePassword(employeeNumber: string, password: string): void {
    if (!this.data.passwords) this.data.passwords = {};
    this.data.passwords[employeeNumber] = password;
    this.saveToLocalStorage();
  }

  deletePassword(employeeNumber: string): void {
    if (this.data.passwords) {
      delete this.data.passwords[employeeNumber];
      this.saveToLocalStorage();
    }
  }

  // Unit Settings
  getUnitSettings(): UnitSettings[] {
    return this.data.unit_settings || [];
  }

  getUnitSetting(id: string): UnitSettings | undefined {
    return (this.data.unit_settings || []).find(s => s.id === id);
  }

  saveUnitSettings(settings: UnitSettings): void {
    if (!this.data.unit_settings) this.data.unit_settings = [];
    // Remove existing settings with same ID
    this.data.unit_settings = this.data.unit_settings.filter(s => s.id !== settings.id);
    // Add new settings
    this.data.unit_settings.push(settings);
    this.saveToLocalStorage();
  }

  deleteUnitSettings(id: string): void {
    if (this.data.unit_settings) {
      this.data.unit_settings = this.data.unit_settings.filter(s => s.id !== id);
      this.saveToLocalStorage();
    }
  }


    // Export/Import
    exportData(): DatabaseSchema {
      return JSON.parse(JSON.stringify(this.data));
    }

    importData(importedData: DatabaseSchema): void {
      this.data = importedData;
      this.saveToLocalStorage();
    }
  }

  // Database singleton
  let db: SimpleDatabase | null = null;

  export const initializeDatabase = async (): Promise<SimpleDatabase> => {
    if (db) return db;

    db = new SimpleDatabase();
    await db.initialize();
    return db;
  };

  export const getDb = async (): Promise<SimpleDatabase> => {
    if (!db) {
      return await initializeDatabase();
    }
    return db;
  };
