import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export interface EncryptedPayload {
  version: 1;
  algorithm: typeof ALGORITHM;
  iv: string;
  tag: string;
  salt: string;
  ciphertext: string;
}

function deriveKey(secret: Buffer, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

export function encryptUtf8(plaintext: string, secret: Buffer): EncryptedPayload {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }
  if (!Buffer.isBuffer(secret) || secret.length < 16) {
    throw new Error('Encryption secret is too short');
  }
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(secret, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 1,
    algorithm: ALGORITHM,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

export function decryptUtf8(payload: EncryptedPayload, secret: Buffer): string {
  if (!payload || payload.version !== 1 || payload.algorithm !== ALGORITHM) {
    throw new Error('Unsupported encrypted payload');
  }
  if (!Buffer.isBuffer(secret) || secret.length < 16) {
    throw new Error('Decryption secret is too short');
  }
  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');
  if (tag.length !== TAG_LENGTH) {
    throw new Error('Invalid authentication tag');
  }
  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
