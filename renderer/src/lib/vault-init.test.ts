import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STORE_UNAVAILABLE_MESSAGE, decideVaultInit } from './vault-init';

test('uses decrypted payload when load succeeds', () => {
  const decision = decideVaultInit({ success: true, data: '{"patients":[]}', exists: true });
  assert.deepEqual(decision, { kind: 'use', payload: '{"patients":[]}' });
});

test('first-run when the vault file is missing', () => {
  const decision = decideVaultInit({ success: true, data: null, exists: false });
  assert.deepEqual(decision, { kind: 'first-run' });
});

test('blocks when the vault exists but decrypt fails', () => {
  const decision = decideVaultInit({
    success: false,
    exists: true,
    error: 'Unsupported state or unable to authenticate data',
  });
  assert.equal(decision.kind, 'blocked');
  if (decision.kind === 'blocked') {
    assert.match(decision.message, /authenticate|opened/i);
  }
});

test('blocks empty payload on an existing vault so defaults cannot overwrite it', () => {
  const decision = decideVaultInit({ success: true, data: '', exists: true });
  assert.deepEqual(decision, { kind: 'blocked', message: STORE_UNAVAILABLE_MESSAGE });
});

test('blocks IPC failure even when exists is unknown', () => {
  const decision = decideVaultInit({ success: false, error: 'Load failed' });
  assert.deepEqual(decision, { kind: 'blocked', message: 'Load failed' });
});
