import { it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/password.js';

it('verifies the right password and rejects the wrong one', async () => {
  const hash = await hashPassword('s3cret-pass');
  assert.equal(await verifyPassword('s3cret-pass', hash), true);
  assert.equal(await verifyPassword('wrong-pass1', hash), false);
});

it('uses a fresh salt for every hash', async () => {
  assert.notEqual(await hashPassword('same-pass1'), await hashPassword('same-pass1'));
});

it('rejects malformed stored hashes', async () => {
  assert.equal(await verifyPassword('anything', 'plain-text'), false);
});
