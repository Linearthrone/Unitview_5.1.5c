import { getDb } from '../lib/database-simple';
import type { Patient, LayoutName } from '../types/patient';
import type { AdmitPatientFormValues } from '../types/forms';
import { mockPatientData } from '../lib/mock-patients';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '../lib/grid-utils';
import type { Nurse, PatientCareTech } from '../types/nurse';

export async function getPatients(layoutName: LayoutName): Promise<Patient[]> {
  if (!layoutName) return [];
  
  try {
    const db = await getDb();
    const patients = db.getPatients(layoutName);
    
    if (patients.length === 0) {
      // Seed the default layout if empty
      if (layoutName === 'North-South View') {
        console.log(`No data for layout '${layoutName}' in database. Seeding initial layout.`);
        return await seedNorthSouthLayout();
      }
      return [];
    }
    
    return patients;
  } catch (error) {
    console.error(`Error fetching patient layout ${layoutName}:`, error);
    if (layoutName === 'North-South View') {
      return await seedNorthSouthLayout();
    }
    return [];
  }
}

export async function savePatients(layoutName: LayoutName, patients: Patient[]): Promise<void> {
  if (!layoutName || !patients) return;

  try {
    const db = await getDb();
    db.savePatients(layoutName, patients);
  } catch (error) {
    console.error(`Error saving patient layout ${layoutName}:`, error);
  }
}

// Seed the default North-South View layout
async function seedNorthSouthLayout(): Promise<Patient[]> {
  const layoutName = 'North-South View';
  const layoutPatients: Patient[] = [];

  const createRoom = (roomNumber: number, row: number, col: number): Patient => ({
    id: `patient-ns-${roomNumber}`,
    bedNumber: roomNumber,
    roomDesignation: `Room ${roomNumber}`,
    name: 'Vacant',
    age: 0,
    admitDate: new Date(),
    dischargeDate: new Date(),
    chiefComplaint: 'N/A',
    ldas: [],
    diet: 'N/A',
    mobility: 'Independent',
    codeStatus: 'Full Code',
    orientationStatus: 'N/A',
    isFallRisk: false,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    isBlocked: false,
    gridRow: row,
    gridColumn: col,
  });

  // Custom top row layout
  const topRowRoomOrder = [826, 825, 824, 823, 822, 821, 820, 819, null, 818, 817, 816, 815, 814, 813, 812, 811];
  topRowRoomOrder.forEach((roomNumber, index) => {
    if (roomNumber) {
      layoutPatients.push(createRoom(roomNumber, 1, index + 1));
    }
  });

  // Bottom Row (Rooms 840-827, left-to-right)
  for (let i = 0; i < 14; i++) {
    layoutPatients.push(createRoom(840 - i, 10, i + 2));
  }
  
  // Left Side (Rooms 801-808)
  for (let i = 0; i < 8; i++) {
    layoutPatients.push(createRoom(801 + i, i + 2, 1));
  }
  
  // Right Side (Rooms 811-816)
  for (let i = 0; i < 6; i++) {
     layoutPatients.push(createRoom(811 + i, i + 2, 17));
  }

  await savePatients(layoutName, layoutPatients);
  return layoutPatients;
}

export async function admitPatient(formData: AdmitPatientFormValues, patients: Patient[]): Promise<Patient[]> {
  return patients.map(p => {
    if (p.bedNumber === formData.bedNumber) {
      return {
        ...p,
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        assignedNurse: formData.assignedNurse === 'To Be Assigned' ? undefined : formData.assignedNurse,
        chiefComplaint: formData.chiefComplaint,
        admitDate: formData.admitDate,
        dischargeDate: formData.dischargeDate,
        ldas: formData.ldas ? formData.ldas.split(',').map(s => s.trim()).filter(Boolean) : [],
        diet: formData.diet,
        mobility: formData.mobility,
        codeStatus: formData.codeStatus,
        orientationStatus: formData.orientationStatus,
        isFallRisk: formData.isFallRisk,
        isSeizureRisk: formData.isSeizureRisk,
        isAspirationRisk: formData.isAspirationRisk,
        isIsolation: formData.isIsolation,
        isInRestraints: formData.isInRestraints,
        isComfortCareDNR: formData.isComfortCareDNR,
        notes: formData.notes,
        isBlocked: false,
      };
    }
    return p;
  });
}

export async function dischargePatient(patientToDischarge: Patient, patients: Patient[]): Promise<Patient[]> {
  const vacantPatient: Patient = {
    ...patientToDischarge,
    name: 'Vacant',
    age: 0,
    gender: undefined,
    admitDate: new Date(),
    dischargeDate: new Date(),
    chiefComplaint: 'N/A',
    ldas: [],
    diet: 'N/A',
    mobility: 'Independent',
    codeStatus: 'Full Code',
    assignedNurse: undefined,
    isFallRisk: false,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    orientationStatus: 'N/A',
    notes: '',
    isBlocked: patientToDischarge.isBlocked,
  };
  return patients.map(p => (p.id === patientToDischarge.id ? vacantPatient : p));
}

function findEmptySlotForPatient(
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
): { row: number; col: number } | null {
  const occupiedCells = new Set<string>();
  
  patients.forEach(p => {
    if (p.gridRow > 0 && p.gridColumn > 0) {
      occupiedCells.add(`${p.gridRow}-${p.gridColumn}`);
    }
  });

  nurses.forEach(n => {
    const cardHeight = n.role === 'Staff Nurse' ? 3 : 1;
    for (let i = 0; i < cardHeight; i++) {
        occupiedCells.add(`${n.gridRow + i}-${n.gridColumn}`);
    }
  });
  
  techs.forEach(t => {
      occupiedCells.add(`${t.gridRow}-${t.gridColumn}`);
  });

  // Prioritize inner grid first
  for (let r = 2; r < NUM_ROWS_GRID; r++) {
    for (let c = 2; c < NUM_COLS_GRID; c++) {
      if (!occupiedCells.has(`${r}-${c}`)) {
        return { row: r, col: c };
      }
    }
  }
  // Then check full grid
  for (let r = 1; r <= NUM_ROWS_GRID; r++) {
    for (let c = 1; c <= NUM_COLS_GRID; c++) {
      if (!occupiedCells.has(`${r}-${c}`)) {
        return { row: r, col: c };
      }
    }
  }

  return null;
}

export async function createRoom(
  designation: string,
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[],
): Promise<{ newPatients: Patient[] | null; error?: string }> {
  const position = findEmptySlotForPatient(patients, nurses, techs);
  if (!position) {
    return { newPatients: null, error: "No empty space on the grid to add a new room." };
  }

  const newBedNumber = Math.max(0, ...patients.map(p => p.bedNumber)) + 1;
  const sanitizedDesignation = designation.trim().replace(/[\s/]/g, '-');

  const newRoom: Patient = {
    id: `room-${sanitizedDesignation}-${newBedNumber}-${Math.random().toString(36).slice(2, 9)}`,
    bedNumber: newBedNumber,
    roomDesignation: designation,
    name: 'Vacant',
    age: 0,
    gender: undefined,
    assignedNurse: undefined,
    admitDate: new Date(),
    dischargeDate: new Date(),
    chiefComplaint: 'N/A',
    ldas: [],
    diet: 'N/A',
    mobility: 'Independent',
    codeStatus: 'Full Code',
    isFallRisk: false,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    orientationStatus: 'N/A',
    notes: undefined,
    gridRow: position.row,
    gridColumn: position.col,
    isBlocked: false,
  };

  return { newPatients: [...patients, newRoom] };
}

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export async function deletePatient(patientId: string): Promise<void> {
    try {
      const db = await getDb();
      // Get all layouts to find which one contains this patient
      const layouts = db.getAllLayouts();
      
      for (const layoutName of layouts) {
        const patients = db.getPatients(layoutName);
        const patientIndex = patients.findIndex(p => p.id === patientId);
        
        if (patientIndex !== -1) {
          // Remove the patient from this layout
          patients.splice(patientIndex, 1);
          db.savePatients(layoutName, patients);
          break;
        }
      }
    } catch (error) {
      console.error(`Error deleting patient ${patientId}:`, error);
    }
  }

  export async function insertMockPatients(currentPatients: Patient[]): Promise<{ updatedPatients: Patient[], insertedCount: number }> {
  const vacantRooms = currentPatients.filter(p => p.name === 'Vacant' && !p.isBlocked);
  
  if (vacantRooms.length === 0) {
    return { updatedPatients: currentPatients, insertedCount: 0 };
  }

  const shuffledMockData = shuffleArray([...mockPatientData]);
  const newPatients = [...currentPatients];
  let insertedCount = 0;

  for (let i = 0; i < vacantRooms.length; i++) {
    const mockData = shuffledMockData[i % shuffledMockData.length];
    const vacantRoom = vacantRooms[i];
    const patientIndex = newPatients.findIndex(p => p.id === vacantRoom.id);

    if (patientIndex !== -1) {
      newPatients[patientIndex] = {
        ...newPatients[patientIndex],
        ...mockData,
        admitDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 5))),
        dischargeDate: new Date(new Date().setDate(new Date().getDate() + Math.floor(Math.random() * 10) + 2)),
      };
      insertedCount++;
    }
  }

  return { updatedPatients: newPatients, insertedCount };
}