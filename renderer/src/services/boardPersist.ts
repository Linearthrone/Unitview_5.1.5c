import { getDb } from '../lib/database-simple';
import type { LayoutName, Patient } from '../types/patient';
import type { Nurse, PatientCareTech } from '../types/nurse';

export async function saveBoardSnapshot(
  layoutName: LayoutName,
  snapshot: {
    patients: Patient[];
    nurses: Nurse[];
    oncomingNurses: Nurse[];
    techs: PatientCareTech[];
  },
): Promise<void> {
  if (!layoutName) {
    throw new Error('Layout name is required to persist the board.');
  }
  const db = await getDb();
  db.saveBoardSnapshot(layoutName, snapshot);
  await db.flushPendingWrites();
}
