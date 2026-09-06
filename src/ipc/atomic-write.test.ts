import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { test } from 'node:test';
import { writeFileAtomicRestricted } from './atomic-write';

test('writeFileAtomicRestricted replaces the destination and leaves no tmp', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unitview-atomic-'));
  const dest = path.join(dir, 'phi.vault.json');
  fs.writeFileSync(dest, 'old', 'utf8');
  writeFileAtomicRestricted(dest, 'new-payload');
  assert.equal(fs.readFileSync(dest, 'utf8'), 'new-payload');
  const leftovers = fs.readdirSync(dir).filter((name) => name.endsWith('.tmp'));
  assert.deepEqual(leftovers, []);
});
