import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { decryptUtf8, encryptUtf8, type EncryptedPayload } from '../security/crypto-core';
import { writeFileAtomicRestricted } from './atomic-write';

const VAULT_FILE = 'phi.vault.json';
const MASTER_KEY_FILE = 'master.key';
const AUDIT_FILE = 'audit.jsonl';
const EPIC_SECRETS_FILE = 'epic.secrets.json';

function userDataPath(...parts: string[]): string {
  return path.join(app.getPath('userData'), ...parts);
}

function writeRestricted(filePath: string, contents: string | Buffer): void {
  fs.writeFileSync(filePath, contents, { encoding: Buffer.isBuffer(contents) ? undefined : 'utf8', mode: 0o600 });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Windows may ignore POSIX mode bits
  }
}

function loadOrCreateMasterKey(): Buffer {
  const keyPath = userDataPath(MASTER_KEY_FILE);
  if (fs.existsSync(keyPath)) {
    const raw = fs.readFileSync(keyPath);
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return Buffer.from(safeStorage.decryptString(raw));
      } catch {
        // Fall through to treat as raw key from older/dev environments
      }
    }
    return raw.length >= 32 ? raw.subarray(0, 32) : Buffer.concat([raw, randomBytes(32)]).subarray(0, 32);
  }

  const key = randomBytes(32);
  if (safeStorage.isEncryptionAvailable()) {
    writeRestricted(keyPath, safeStorage.encryptString(key.toString('base64')));
  } else {
    writeRestricted(keyPath, key);
  }
  return key;
}

export function vaultExists(): boolean {
  return fs.existsSync(userDataPath(VAULT_FILE));
}

export function saveVault(plaintext: string): void {
  const payload = encryptUtf8(plaintext, loadOrCreateMasterKey());
  writeFileAtomicRestricted(userDataPath(VAULT_FILE), JSON.stringify(payload));
}

export function loadVault(): string | null {
  const filePath = userDataPath(VAULT_FILE);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EncryptedPayload;
  return decryptUtf8(parsed, loadOrCreateMasterKey());
}

export function saveEpicSecrets(secrets: { privateKeyPem?: string }): void {
  const payload = encryptUtf8(JSON.stringify(secrets), loadOrCreateMasterKey());
  writeRestricted(userDataPath(EPIC_SECRETS_FILE), JSON.stringify(payload));
}

export function loadEpicSecrets(): { privateKeyPem?: string } {
  const filePath = userDataPath(EPIC_SECRETS_FILE);
  if (!fs.existsSync(filePath)) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EncryptedPayload;
  const decoded = JSON.parse(decryptUtf8(parsed, loadOrCreateMasterKey())) as { privateKeyPem?: string };
  return decoded;
}

export function appendAuditLine(line: string): void {
  fs.appendFileSync(userDataPath(AUDIT_FILE), `${line}\n`, { encoding: 'utf8', mode: 0o600 });
}

export function readAuditLines(maxLines = 200): string[] {
  const filePath = userDataPath(AUDIT_FILE);
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  return lines.slice(-Math.max(1, maxLines));
}

export function vaultUsesOsKeychain(): boolean {
  return safeStorage.isEncryptionAvailable();
}
