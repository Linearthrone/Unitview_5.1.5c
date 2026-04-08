import * as patientService from './patientService';
import * as nurseService from './nurseService';
import type { LayoutName } from '../types/patient';

export interface FacilityStatistics {
  unitCount: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyPercent: number;
  totalNurses: number;
  totalTechs: number;
  patientsFallRisk: number;
  patientsIsolation: number;
}

function isOccupiedBed(name: string): boolean {
  return name.trim() !== '' && name !== 'Vacant';
}

/**
 * Aggregates patient and staff counts across all layout names (units) that exist in the database.
 */
export async function computeFacilityStatistics(layoutNames: LayoutName[]): Promise<FacilityStatistics> {
  const unique = [...new Set(layoutNames)].filter(Boolean);
  if (unique.length === 0) {
    return {
      unitCount: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      vacantBeds: 0,
      occupancyPercent: 0,
      totalNurses: 0,
      totalTechs: 0,
      patientsFallRisk: 0,
      patientsIsolation: 0,
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
      const occupied = patients.filter((p) => isOccupiedBed(p.name)).length;
      const fall = patients.filter((p) => isOccupiedBed(p.name) && p.isFallRisk).length;
      const iso = patients.filter((p) => isOccupiedBed(p.name) && p.isIsolation).length;
      return {
        beds,
        occupied,
        nurses: nurses.length,
        techs: techs.length,
        fall,
        iso,
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
    occupancyPercent: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    totalNurses: results.reduce((s, r) => s + r.nurses, 0),
    totalTechs: results.reduce((s, r) => s + r.techs, 0),
    patientsFallRisk: results.reduce((s, r) => s + r.fall, 0),
    patientsIsolation: results.reduce((s, r) => s + r.iso, 0),
  };
}
