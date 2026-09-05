import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decryptUtf8, encryptUtf8 } from './crypto-core';

test('round-trips UTF-8 with AES-256-GCM', () => {
  const secret = Buffer.from('unitview-test-secret-key!!');
  const payload = encryptUtf8('{"patients":1}', secret);
  assert.equal(payload.algorithm, 'aes-256-gcm');
  assert.notEqual(payload.ciphertext, '{"patients":1}');
  assert.equal(decryptUtf8(payload, secret), '{"patients":1}');
});

test('rejects tampered ciphertext', () => {
  const secret = Buffer.from('unitview-test-secret-key!!');
  const payload = encryptUtf8('phi', secret);
  payload.ciphertext = Buffer.from('tampered').toString('base64');
  assert.throws(() => decryptUtf8(payload, secret));
});
