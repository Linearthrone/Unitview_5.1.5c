import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePasswordPolicy } from './password-policy';

test('rejects short and common passwords', () => {
  assert.equal(validatePasswordPolicy('short1').ok, false);
  assert.equal(validatePasswordPolicy('password123').ok, false);
  assert.equal(validatePasswordPolicy('nurse1234567', '1001').ok, true);
  assert.equal(validatePasswordPolicy('admin-is-1001-ok', '1001').ok, false);
});

test('accepts a sufficiently long mixed password', () => {
  const result = validatePasswordPolicy('CorrectHorse9battery');
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});
