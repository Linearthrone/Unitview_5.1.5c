const HASH_PREFIX = 'pbkdf2';
const DIGEST = 'SHA-256';
const ITERATIONS = 210_000;
const KEY_LEN = 32;
const SALT_LEN = 16;

function bytesToB64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function b64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export function isPasswordHash(value: string): boolean {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error('Password is required');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: DIGEST },
    key,
    KEY_LEN * 8
  );
  return [HASH_PREFIX, 'sha256', String(ITERATIONS), bytesToB64(salt), bytesToB64(new Uint8Array(bits))].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!password || !isPasswordHash(stored)) return false;
  const parts = stored.split('$');
  if (parts.length !== 5) return false;
  const iterations = Number(parts[2]);
  const salt = b64ToBytes(parts[3] ?? '');
  const expected = b64ToBytes(parts[4] ?? '');
  if (!Number.isFinite(iterations) || salt.length === 0 || expected.length === 0) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const saltBuffer = new Uint8Array(salt);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations, hash: DIGEST },
    key,
    expected.length * 8
  );
  return timingSafeEqual(new Uint8Array(bits), expected);
}
