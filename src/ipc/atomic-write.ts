import * as fs from 'fs';
import * as path from 'path';

/**
 * Write then replace so a crash cannot leave a half-written vault.
 * On Windows, rename onto an existing file can fail; fall back to copy+unlink.
 */
export function writeFileAtomicRestricted(filePath: string, contents: string | Buffer): void {
  const directory = path.dirname(filePath);
  const tmpPath = path.join(directory, `${path.basename(filePath)}.${process.pid}.tmp`);
  const encoding = Buffer.isBuffer(contents) ? undefined : 'utf8';
  fs.writeFileSync(tmpPath, contents, { encoding, mode: 0o600 });
  try {
    fs.chmodSync(tmpPath, 0o600);
  } catch {
    // Windows may ignore POSIX mode bits
  }
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    fs.copyFileSync(tmpPath, filePath);
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // tmp leftover is harmless; dest already replaced
    }
  }
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Windows may ignore POSIX mode bits
  }
}
