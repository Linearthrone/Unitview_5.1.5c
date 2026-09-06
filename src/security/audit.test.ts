import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAuditRecord, redactAuditDetail } from './audit';

test('redacts MRN-like and name-like fragments', () => {
  const redacted = redactAuditDetail('Viewed patient name: Camila Lopez MRN: 203713');
  assert.ok(redacted);
  assert.equal(redacted.includes('Camila'), false);
  assert.equal(redacted.includes('203713'), false);
  assert.ok(redacted.includes('[REDACTED]'));
});

test('creates a bounded audit record', () => {
  const record = createAuditRecord({
    action: 'LOGIN_FAILURE',
    actorEmployeeNumber: '1001',
    success: false,
    detail: 'Invalid password',
  });
  assert.equal(record.action, 'LOGIN_FAILURE');
  assert.equal(record.success, false);
  assert.match(record.timestamp, /^\d{4}-/);
});
