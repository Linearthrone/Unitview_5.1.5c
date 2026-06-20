export interface FacilityProfile {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  /** Base64 data URL for facility logo (PNG/JPEG/SVG). */
  logoDataUrl?: string;
  lastModified?: string;
}

export const defaultFacilityProfile: FacilityProfile = {
  name: 'Your Facility Name',
  addressLine1: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
};
