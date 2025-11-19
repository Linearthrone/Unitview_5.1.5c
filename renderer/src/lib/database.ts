import Database from 'better-sqlite3';
import type { Patient, LayoutName, UserPreferences, AssignmentSet } from '../types/patient';
import type { Nurse, PatientCareTech, Spectra } from '../types/nurse';

// Database singleton
let db: Database.Database | null = null;

export const initializeDatabase = async (): Promise<Database.Database> => {
  if (db) return db;

  // Get app data directory from Electron
  const dbPath = window.electronAPI 
    ? `${await window.electronAPI.getUserDataPath()}/unitview.db`
    : './unitview.db';

  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables if they don't exist
  createTables();
  
  return db;
};

const createTables = () => {
  if (!db) throw new Error('Database not initialized');

  // User Preferences Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Layouts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Patients Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      layout_name TEXT NOT NULL,
      bed_number INTEGER NOT NULL,
      room_designation TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT,
      admit_date DATETIME NOT NULL,
      discharge_date DATETIME NOT NULL,
      chief_complaint TEXT NOT NULL,
      ldas TEXT, -- JSON array
      diet TEXT NOT NULL,
      mobility TEXT NOT NULL,
      code_status TEXT NOT NULL,
      orientation_status TEXT NOT NULL,
      assigned_nurse TEXT,
      is_fall_risk BOOLEAN NOT NULL DEFAULT 0,
      is_seizure_risk BOOLEAN NOT NULL DEFAULT 0,
      is_aspiration_risk BOOLEAN NOT NULL DEFAULT 0,
      is_isolation BOOLEAN NOT NULL DEFAULT 0,
      is_in_restraints BOOLEAN NOT NULL DEFAULT 0,
      is_comfort_care_dnr BOOLEAN NOT NULL DEFAULT 0,
      is_blocked BOOLEAN NOT NULL DEFAULT 0,
      notes TEXT,
      grid_row INTEGER NOT NULL,
      grid_column INTEGER NOT NULL,
      FOREIGN KEY (layout_name) REFERENCES layouts(name) ON DELETE CASCADE
    )
  `);

  // Nurses Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nurses (
      id TEXT PRIMARY KEY,
      layout_name TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      spectra TEXT,
      relief TEXT,
      assigned_patient_ids TEXT, -- JSON array
      grid_row INTEGER NOT NULL,
      grid_column INTEGER NOT NULL,
      FOREIGN KEY (layout_name) REFERENCES layouts(name) ON DELETE CASCADE
    )
  `);

  // Patient Care Techs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patient_care_techs (
      id TEXT PRIMARY KEY,
      layout_name TEXT NOT NULL,
      name TEXT NOT NULL,
      spectra TEXT NOT NULL,
      assignment_group TEXT NOT NULL,
      grid_row INTEGER NOT NULL,
      grid_column INTEGER NOT NULL,
      FOREIGN KEY (layout_name) REFERENCES layouts(name) ON DELETE CASCADE
    )
  `);

  // Spectra Pool Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spectra_pool (
      id TEXT PRIMARY KEY,
      in_service BOOLEAN NOT NULL DEFAULT 1
    )
  `);

  // Assignment Sets Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignment_sets (
      id TEXT PRIMARY KEY,
      layout_name TEXT NOT NULL,
      shift TEXT NOT NULL,
      date DATETIME NOT NULL,
      charge_nurse_name TEXT NOT NULL,
      assignments TEXT NOT NULL, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (layout_name) REFERENCES layouts(name) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_patients_layout ON patients(layout_name);
    CREATE INDEX IF NOT EXISTS idx_nurses_layout ON nurses(layout_name);
    CREATE INDEX IF NOT EXISTS idx_techs_layout ON patient_care_techs(layout_name);
    CREATE INDEX IF NOT EXISTS idx_assignments_layout ON assignment_sets(layout_name);
  `);
};

// Helper function to get database instance
const getDb = async (): Promise<Database.Database> => {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
};

// Type conversion helpers
const patientFromDb = (row: any): Patient => ({
  ...row,
  admitDate: new Date(row.admit_date),
  dischargeDate: new Date(row.discharge_date),
  ldas: row.ldas ? JSON.parse(row.ldas) : [],
  isFallRisk: Boolean(row.is_fall_risk),
  isSeizureRisk: Boolean(row.is_seizure_risk),
  isAspirationRisk: Boolean(row.is_aspiration_risk),
  isIsolation: Boolean(row.is_isolation),
  isInRestraints: Boolean(row.is_in_restraints),
  isComfortCareDNR: Boolean(row.is_comfort_care_dnr),
  isBlocked: Boolean(row.is_blocked),
  gridRow: row.grid_row,
  gridColumn: row.grid_column,
  assignedNurse: row.assigned_nurse || undefined,
  notes: row.notes || undefined,
});

const patientToDb = (patient: Patient): any => ({
  id: patient.id,
  layout_name: patient.layoutName || 'default',
  bed_number: patient.bedNumber,
  room_designation: patient.roomDesignation,
  name: patient.name,
  age: patient.age,
  gender: patient.gender || null,
  admit_date: patient.admitDate.toISOString(),
  discharge_date: patient.dischargeDate.toISOString(),
  chief_complaint: patient.chiefComplaint,
  ldas: JSON.stringify(patient.ldas),
  diet: patient.diet,
  mobility: patient.mobility,
  code_status: patient.codeStatus,
  orientation_status: patient.orientationStatus,
  assigned_nurse: patient.assignedNurse || null,
  is_fall_risk: patient.isFallRisk ? 1 : 0,
  is_seizure_risk: patient.isSeizureRisk ? 1 : 0,
  is_aspiration_risk: patient.isAspirationRisk ? 1 : 0,
  is_isolation: patient.isIsolation ? 1 : 0,
  is_in_restraints: patient.isInRestraints ? 1 : 0,
  is_comfort_care_dnr: patient.isComfortCareDNR ? 1 : 0,
  is_blocked: patient.isBlocked ? 1 : 0,
  notes: patient.notes || null,
  grid_row: patient.gridRow,
  grid_column: patient.gridColumn,
});

const nurseFromDb = (row: any): Nurse => ({
  ...row,
  assignedPatientIds: row.assigned_patient_ids ? JSON.parse(row.assigned_patient_ids) : Array(6).fill(null),
  gridRow: row.grid_row,
  gridColumn: row.grid_column,
  spectra: row.spectra || undefined,
  relief: row.relief || undefined,
});

const nurseToDb = (nurse: Nurse): any => ({
  id: nurse.id,
  layout_name: nurse.layoutName || 'default',
  name: nurse.name,
  role: nurse.role,
  spectra: nurse.spectra || null,
  relief: nurse.relief || null,
  assigned_patient_ids: JSON.stringify(nurse.assignedPatientIds),
  grid_row: nurse.gridRow,
  grid_column: nurse.gridColumn,
});

const techFromDb = (row: any): PatientCareTech => ({
  ...row,
  gridRow: row.grid_row,
  gridColumn: row.grid_column,
});

const techToDb = (tech: PatientCareTech): any => ({
  id: tech.id,
  layout_name: tech.layoutName || 'default',
  name: tech.name,
  spectra: tech.spectra,
  assignment_group: tech.assignmentGroup,
  grid_row: tech.gridRow,
  grid_column: tech.gridColumn,
});

export { getDb, patientFromDb, patientToDb, nurseFromDb, nurseToDb, techFromDb, techToDb };