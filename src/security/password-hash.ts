import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const HASH_PREFIX = 'pbkdf2';
const DIGEST = 'sha256';
const ITERATIONS = 210_000;
const KEY_LEN = 32;
const SALT_LEN = 16;

export interface PasswordHashParts {
  algorithm: typeof HASH_PREFIX;
  digest: typeof DIGEST;
  iterations: number;
  saltB64: string;
  hashB64: string;
}

export function isPasswordHash(value: string): boolean {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

export function hashPassword(password: string, salt?: Buffer): string {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password is required');
  }
  const usedSalt = salt ?? randomBytes(SALT_LEN);
  const derived = pbkdf2Sync(password, usedSalt, ITERATIONS, KEY_LEN, DIGEST);
  return [
    HASH_PREFIX,
    DIGEST,
    String(ITERATIONS),
    usedSalt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

export function verifyPassword(password: string, stored: string): boolean {
  if (typeof password !== 'string' || typeof stored !== 'string') {
    return false;
  }
  if (!isPasswordHash(stored)) {
    return false;
  }
  const parts = stored.split('$');
  if (parts.length !== 5) {
    return false;
  }
  const [, digest, iterationsRaw, saltB64, hashB64] = parts;
  const iterations = Number(iterationsRaw);
  if (digest !== DIGEST || !Number.isFinite(iterations) || iterations < 1) {
    return false;
  }
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, 'base64');
    expected = Buffer.from(hashB64, 'base64');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) {
    return false;
  }
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, digest);
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}
