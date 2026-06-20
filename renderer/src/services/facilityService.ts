import { getDb } from '../lib/database-simple';
import { defaultFacilityProfile, type FacilityProfile } from '../types/facility';

export async function getFacilityProfile(): Promise<FacilityProfile> {
  const db = await getDb();
  return db.getFacilityProfile();
}

export async function saveFacilityProfile(profile: FacilityProfile): Promise<void> {
  const db = await getDb();
  db.saveFacilityProfile({
    ...profile,
    lastModified: new Date().toISOString(),
  });
}

export function formatFacilityAddress(profile: FacilityProfile): string {
  const parts = [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state].filter(Boolean).join(', '),
    profile.zip,
  ].filter((part) => part && part.trim().length > 0);
  return parts.join(' · ');
}

export { defaultFacilityProfile };
