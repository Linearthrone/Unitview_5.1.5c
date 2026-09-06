export const STORE_UNAVAILABLE_MESSAGE =
  'Encrypted store could not be opened. Existing data was not changed.';

export type VaultLoadResult = {
  success: boolean;
  data?: string | null;
  exists?: boolean;
  error?: string;
};

export type VaultInitDecision =
  | { kind: 'use'; payload: string }
  | { kind: 'first-run' }
  | { kind: 'blocked'; message: string };

export function decideVaultInit(result: VaultLoadResult): VaultInitDecision {
  if (result.success && typeof result.data === 'string' && result.data.length > 0) {
    return { kind: 'use', payload: result.data };
  }
  if (result.exists === true) {
    return {
      kind: 'blocked',
      message: result.error?.trim() || STORE_UNAVAILABLE_MESSAGE,
    };
  }
  if (!result.success) {
    return {
      kind: 'blocked',
      message: result.error?.trim() || STORE_UNAVAILABLE_MESSAGE,
    };
  }
  return { kind: 'first-run' };
}
