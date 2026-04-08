import { getDb } from '../lib/database-simple';
import type { Nurse, PatientCareTech, Spectra, SpectraLogEntry, SpectraStatus } from '../types/nurse';

export async function getSpectraPool(): Promise<Spectra[]> {
  try {
    const db = await getDb();
    const rows = db.getSpectraPool();

    return rows.map((row) => ({
      ...row,
      status: row.status ?? (row.inService ? 'in service' : 'out of service'),
      logs: Array.isArray(row.logs) ? row.logs : [],
    }));
  } catch (error) {
    console.error('Error fetching spectra pool:', error);
    return [];
  }
}

export async function saveSpectraPool(pool: Spectra[]): Promise<void> {
  try {
    const db = await getDb();
    db.saveSpectraPool(pool);
  } catch (error) {
    console.error('Error saving spectra pool:', error);
    throw error;
  }
}

export async function addSpectra(spectraId: string, currentPool: Spectra[]): Promise<{ newPool?: Spectra[]; error?: string }> {
  const normalizedId = spectraId.trim().toUpperCase();
  if (!normalizedId) return { error: 'Device ID is required.' };
  if (currentPool.some((item) => item.id.toUpperCase() === normalizedId)) return { error: 'That Spectralink already exists.' };

  const newDevice: Spectra = {
    id: normalizedId,
    inService: true,
    status: 'in service',
    assignedTo: '',
    logs: [],
  };
  const nextPool = [...currentPool, newDevice].sort((a, b) => a.id.localeCompare(b.id));
  await saveSpectraPool(nextPool);
  return { newPool: nextPool };
}

export async function toggleSpectraStatus(
  spectraId: string,
  inService: boolean,
  currentPool: Spectra[],
  nurses: Nurse[],
  techs: PatientCareTech[]
): Promise<{ newPool?: Spectra[]; error?: string }> {
  const device = currentPool.find((item) => item.id === spectraId);
  if (!device) return { error: 'Device not found.' };
  if (!inService && device.assignedTo) {
    const stillAssigned =
      nurses.some((nurse) => nurse.name === device.assignedTo) ||
      techs.some((tech) => tech.name === device.assignedTo);
    if (stillAssigned) {
      return { error: `Cannot take ${spectraId} out of service while assigned to ${device.assignedTo}.` };
    }
  }

  const status: SpectraStatus = inService ? 'in service' : 'out of service';
  return updateDeviceStatus(spectraId, status, currentPool);
}

export async function updateDeviceStatus(
  spectraId: string,
  status: SpectraStatus,
  currentPool: Spectra[]
): Promise<{ newPool?: Spectra[]; error?: string }> {
  const exists = currentPool.some((item) => item.id === spectraId);
  if (!exists) return { error: 'Device not found.' };

  const nextPool = currentPool.map((item) =>
    item.id === spectraId
      ? {
          ...item,
          status,
          inService: status === 'in service',
        }
      : item
  );
  await saveSpectraPool(nextPool);
  return { newPool: nextPool };
}

export async function assignDeviceToStaff(
  spectraId: string,
  staffName: string,
  currentPool: Spectra[]
): Promise<{ newPool?: Spectra[]; error?: string }> {
  const device = currentPool.find((item) => item.id === spectraId);
  if (!device) return { error: 'Device not found.' };
  if ((device.status ?? (device.inService ? 'in service' : 'out of service')) !== 'in service') {
    return { error: 'Only in-service devices can be assigned.' };
  }

  const nextPool = currentPool.map((item) => {
    if (item.id === spectraId) return { ...item, assignedTo: staffName };
    if (item.assignedTo === staffName) return { ...item, assignedTo: '' };
    return item;
  });
  await saveSpectraPool(nextPool);
  return { newPool: nextPool };
}

export async function unassignDevice(
  spectraId: string,
  currentPool: Spectra[]
): Promise<{ newPool?: Spectra[]; error?: string }> {
  const exists = currentPool.some((item) => item.id === spectraId);
  if (!exists) return { error: 'Device not found.' };
  const nextPool = currentPool.map((item) => (item.id === spectraId ? { ...item, assignedTo: '' } : item));
  await saveSpectraPool(nextPool);
  return { newPool: nextPool };
}

export async function addDeviceLog(
  spectraId: string,
  message: string,
  currentPool: Spectra[]
): Promise<{ newPool?: Spectra[]; error?: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { error: 'Log message cannot be empty.' };
  const exists = currentPool.some((item) => item.id === spectraId);
  if (!exists) return { error: 'Device not found.' };
  const newLog: SpectraLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    message: trimmed,
  };
  const nextPool = currentPool.map((item) =>
    item.id === spectraId ? { ...item, logs: [...(item.logs ?? []), newLog] } : item
  );
  await saveSpectraPool(nextPool);
  return { newPool: nextPool };
}