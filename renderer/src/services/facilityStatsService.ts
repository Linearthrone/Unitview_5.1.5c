import * as patientService from './patientService';
import * as nurseService from './nurseService';
import type { LayoutName } from '../types/patient';
import { getIsolationType, isOccupiedPatient } from '../lib/patient-clinical-helpers';

export interface FacilityStatistics {
  unitCount: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  adtAdmissions: number;
  adtDischargesDueToday: number;
  adtTransfersFlagged: number;
  totalNurses: number;
  totalTechs: number;
  patientsFallRisk: number;
  patientsIsolation: number;
  isolationContact: number;
  isolationAirborne: number;
  isolationDroplet: number;
}

function isSameCalendarDay(dateValue: Date, target: Date): boolean {
  return (
    dateValue.getFullYear() === target.getFullYear() &&
    dateValue.getMonth() === target.getMonth() &&
    dateValue.getDate() === target.getDate()
  );
}

/**
 * Aggregates patient and staff counts across all layout names (units) that exist in the database.
 */
export async function computeFacilityStatistics(layoutNames: LayoutName[]): Promise<FacilityStatistics> {
  const unique = [...new Set(layoutNames)].filter(Boolean);
  const today = new Date();
  if (unique.length === 0) {
    return {
      unitCount: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      vacantBeds: 0,
      adtAdmissions: 0,
      adtDischargesDueToday: 0,
      adtTransfersFlagged: 0,
      totalNurses: 0,
      totalTechs: 0,
      patientsFallRisk: 0,
      patientsIsolation: 0,
      isolationContact: 0,
      isolationAirborne: 0,
      isolationDroplet: 0,
    };
  }

  const results = await Promise.all(
    unique.map(async (layoutName) => {
      const [patients, nurses, techs] = await Promise.all([
        patientService.getPatients(layoutName),
        nurseService.getNurses(layoutName),
        nurseService.getTechs(layoutName),
      ]);
      const beds = patients.length;
      const occupiedPatients = patients.filter((p) => isOccupiedPatient(p.name));
      const occupied = occupiedPatients.length;
      const fall = occupiedPatients.filter((p) => p.isFallRisk).length;
      const iso = occupiedPatients.filter((p) => p.isIsolation).length;
      let isolationContact = 0;
      let isolationAirborne = 0;
      let isolationDroplet = 0;
      for (const p of occupiedPatients) {
        const type = getIsolationType(p);
        if (type === 'Contact') isolationContact += 1;
        else if (type === 'Airborne') isolationAirborne += 1;
        else if (type === 'Droplet') isolationDroplet += 1;
      }
      const dischargesDueToday = occupiedPatients.filter((p) =>
        isSameCalendarDay(new Date(p.dischargeDate), today)
      ).length;
      const transfersFlagged = occupiedPatients.filter((p) => {
        const transferText = `${p.chiefComplaint ?? ''} ${p.notes ?? ''}`.toLowerCase();
        return transferText.includes('transfer');
      }).length;
      return {
        beds,
        occupied,
        nurses: nurses.length,
        techs: techs.length,
        fall,
        iso,
        isolationContact,
        isolationAirborne,
        isolationDroplet,
        dischargesDueToday,
        transfersFlagged,
      };
    })
  );

  const totalBeds = results.reduce((s, r) => s + r.beds, 0);
  const occupiedBeds = results.reduce((s, r) => s + r.occupied, 0);
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

  return {
    unitCount: unique.length,
    totalBeds,
    occupiedBeds,
    vacantBeds,
    adtAdmissions: occupiedBeds,
    adtDischargesDueToday: results.reduce((s, r) => s + r.dischargesDueToday, 0),
    adtTransfersFlagged: results.reduce((s, r) => s + r.transfersFlagged, 0),
    totalNurses: results.reduce((s, r) => s + r.nurses, 0),
    totalTechs: results.reduce((s, r) => s + r.techs, 0),
    patientsFallRisk: results.reduce((s, r) => s + r.fall, 0),
    patientsIsolation: results.reduce((s, r) => s + r.iso, 0),
    isolationContact: results.reduce((s, r) => s + r.isolationContact, 0),
    isolationAirborne: results.reduce((s, r) => s + r.isolationAirborne, 0),
    isolationDroplet: results.reduce((s, r) => s + r.isolationDroplet, 0),
  };
}
