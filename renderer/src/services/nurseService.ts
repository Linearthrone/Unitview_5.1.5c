import { getDb } from '../lib/database-simple';
import type { Nurse, PatientCareTech, Spectra } from '../types/nurse';
import type { Patient } from '../types/patient';
import type { AddStaffMemberFormValues } from '../types/forms';
import type { LayoutName } from '../types/patient';
import { findCompactEmptySlot, getAvailableSpectra } from './nurseHelpers';
import * as layoutService from './layoutService';

export async function getNurses(layoutName: LayoutName): Promise<Nurse[]> {
  if (!layoutName) return [];
  
  try {
    const db = await getDb();
    const nurses = db.getNurses(layoutName);
    
    // Validate each nurse object to ensure assignedPatientIds is an array
    const metadata = await layoutService.getLayoutMetadata(layoutName);
    const nurseCapacity = Math.max(1, metadata.nurseToPatientRatio);
    const validNurses = nurses.map(n => {
      const ids = Array.isArray(n.assignedPatientIds) ? n.assignedPatientIds : [];
      const slotCount = Math.max(nurseCapacity, ids.length);
      return {
        ...n,
        assignedPatientIds: Array.from({ length: slotCount }, (_, index) => ids[index] ?? null),
      };
    });
    
    console.log(`Loaded ${validNurses.length} nurses for layout "${layoutName}"`);
    return validNurses;
  } catch (error) {
    console.error('Error getting nurses:', error);
    throw error;
  }
}

export async function getOncomingNurses(layoutName: LayoutName): Promise<Nurse[]> {
  if (!layoutName) return [];
  try {
    const db = await getDb();
    const nurses = db.getOncomingNurses(layoutName);
    const metadata = await layoutService.getLayoutMetadata(layoutName);
    const nurseCapacity = Math.max(1, metadata.nurseToPatientRatio);
    return nurses.map(n => {
      const ids = Array.isArray(n.assignedPatientIds) ? n.assignedPatientIds : [];
      const slotCount = Math.max(nurseCapacity, ids.length);
      return {
        ...n,
        assignedPatientIds: Array.from({ length: slotCount }, (_, index) => ids[index] ?? null),
      };
    });
  } catch (error) {
    console.error('Error getting oncoming nurses:', error);
    throw error;
  }
}

export async function getTechs(layoutName: LayoutName): Promise<PatientCareTech[]> {
  if (!layoutName) return [];
  
  try {
    const db = await getDb();
    const techs = db.getTechs(layoutName);
    
    console.log(`Loaded ${techs.length} techs for layout "${layoutName}"`);
    return techs;
  } catch (error) {
    console.error('Error getting techs:', error);
    throw error;
  }
}

export async function saveNurses(layoutName: LayoutName, nurses: Nurse[]): Promise<void> {
  try {
    const db = await getDb();
    db.saveNurses(layoutName, nurses);
    await db.flushPendingWrites();
    console.log(`Saved ${nurses.length} nurses for layout "${layoutName}"`);
  } catch (error) {
    console.error('Error saving nurses:', error);
    throw error;
  }
}

export async function saveOncomingNurses(layoutName: LayoutName, nurses: Nurse[]): Promise<void> {
  try {
    const db = await getDb();
    db.saveOncomingNurses(layoutName, nurses);
    await db.flushPendingWrites();
  } catch (error) {
    console.error('Error saving oncoming nurses:', error);
    throw error;
  }
}

export async function saveTechs(layoutName: LayoutName, techs: PatientCareTech[]): Promise<void> {
  try {
    const db = await getDb();
    db.saveTechs(layoutName, techs);
    await db.flushPendingWrites();
    console.log(`Saved ${techs.length} techs for layout "${layoutName}"`);
  } catch (error) {
    console.error('Error saving techs:', error);
    throw error;
  }
}

export async function addStaffMember(
  layoutName: LayoutName,
  staffData: AddStaffMemberFormValues,
  currentNurses: Nurse[],
  currentTechs: PatientCareTech[],
  currentPatients: Patient[],
  spectraPool: Spectra[]
): Promise<{ nurses: Nurse[]; techs: PatientCareTech[] }> {
  const { name, role, spectra, relief } = staffData;
  const newId = `${role.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
  const metadata = await layoutService.getLayoutMetadata(layoutName);
  const nurseCapacity = Math.max(1, metadata.nurseToPatientRatio);
  const cardHeight = role === 'Staff Nurse' || role === 'Float Pool Nurse' ? 3 : 1;
  const slot = findCompactEmptySlot(currentPatients, currentNurses, currentTechs, cardHeight, 1);
  if (!slot) {
    throw new Error('No empty slot available for new staff member');
  }

  const newNurses = [...currentNurses];
  const newTechs = [...currentTechs];

  if (role === 'Staff Nurse' || role === 'Float Pool Nurse' || role === 'Charge Nurse' || role === 'Unit Clerk') {
    const availableSpectra = getAvailableSpectra(spectraPool, currentNurses, currentTechs);
    const assignedSpectra = spectra || availableSpectra[0]?.id || '';

    const newNurse: Nurse = {
      id: newId,
      name,
      role,
      spectra: assignedSpectra,
      relief: relief || '',
      assignedPatientIds: Array(nurseCapacity).fill(null),
      gridRow: slot.row,
      gridColumn: slot.col,
    };

    newNurses.push(newNurse);
    console.log(`Added nurse: ${name} with spectra ${assignedSpectra}`);
  } else if (role === 'Patient Care Tech') {
    const newTech: PatientCareTech = {
      id: newId,
      name,
      spectra: spectra || '',
      assignmentGroup: '',
      gridRow: slot.row,
      gridColumn: slot.col,
    };

    newTechs.push(newTech);
    console.log(`Added tech: ${name}`);
  }

  await Promise.all([
    saveNurses(layoutName, newNurses),
    saveTechs(layoutName, newTechs),
  ]);

  return { nurses: newNurses, techs: newTechs };
}

export async function removeNurse(
  layoutName: LayoutName,
  nurseId: string,
  currentNurses: Nurse[]
): Promise<Nurse[]> {
  const updatedNurses = currentNurses.filter(n => n.id !== nurseId);
  
  try {
    const db = await getDb();
    // Remove from database
    const nurses = db.getNurses(layoutName);
    const filteredNurses = nurses.filter(n => n.id !== nurseId);
    db.saveNurses(layoutName, filteredNurses);
    
    console.log(`Removed nurse with ID: ${nurseId}`);
    return updatedNurses;
  } catch (error) {
    console.error('Error removing nurse:', error);
    throw error;
  }
}

export async function removeTech(
  layoutName: LayoutName,
  techId: string,
  currentTechs: PatientCareTech[]
): Promise<PatientCareTech[]> {
  const updatedTechs = currentTechs.filter(t => t.id !== techId);
  
  try {
    const db = await getDb();
    // Remove from database
    const techs = db.getTechs(layoutName);
    const filteredTechs = techs.filter(t => t.id !== techId);
    db.saveTechs(layoutName, filteredTechs);
    
    console.log(`Removed tech with ID: ${techId}`);
    return updatedTechs;
  } catch (error) {
    console.error('Error removing tech:', error);
    throw error;
  }
}

// Assignment management
export async function assignPatientToNurse(
  layoutName: LayoutName,
  nurseId: string,
  patientId: string | null,
  slotIndex: number,
  currentNurses: Nurse[]
): Promise<Nurse[]> {
  const updatedNurses = currentNurses.map(nurse => {
    if (nurse.id === nurseId) {
      const newAssignedIds = [...(nurse.assignedPatientIds || [])];
      newAssignedIds[slotIndex] = patientId;
      return { ...nurse, assignedPatientIds: newAssignedIds };
    }
    return nurse;
  });

  try {
    const db = await getDb();
    db.saveNurses(layoutName, updatedNurses);
    console.log(`Assigned patient ${patientId} to nurse ${nurseId} at slot ${slotIndex}`);
    return updatedNurses;
  } catch (error) {
    console.error('Error assigning patient to nurse:', error);
    throw error;
  }
}

export async function clearNurseAssignments(
  layoutName: LayoutName,
  nurseId: string,
  currentNurses: Nurse[]
): Promise<Nurse[]> {
  const metadata = await layoutService.getLayoutMetadata(layoutName);
  const nurseCapacity = Math.max(1, metadata.nurseToPatientRatio);
  const updatedNurses = currentNurses.map(nurse => {
    if (nurse.id === nurseId) {
      return { ...nurse, assignedPatientIds: Array(nurseCapacity).fill(null) };
    }
    return nurse;
  });

  try {
    const db = await getDb();
    db.saveNurses(layoutName, updatedNurses);
    console.log(`Cleared assignments for nurse ${nurseId}`);
    return updatedNurses;
  } catch (error) {
    console.error('Error clearing nurse assignments:', error);
    throw error;
  }
}

export async function activateOncomingShift(layoutName: LayoutName): Promise<void> {
  const db = await getDb();
  db.activateOncomingShift(layoutName);
}