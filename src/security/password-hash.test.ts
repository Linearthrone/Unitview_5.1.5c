import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, isPasswordHash, verifyPassword } from './password-hash';

test('hashes and verifies with a timing-safe compare', () => {
  const stored = hashPassword('CorrectHorse9battery');
  assert.equal(isPasswordHash(stored), true);
  assert.equal(verifyPassword('CorrectHorse9battery', stored), true);
  assert.equal(verifyPassword('wrong-password', stored), false);
  assert.equal(verifyPassword('CorrectHorse9battery', 'plaintext'), false);
});
