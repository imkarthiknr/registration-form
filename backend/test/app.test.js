import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { UserStore } from '../src/user-store.js';

const valid = { name: 'Grace Hopper', email: 'Grace@Example.com ', password: 'cobol1959' };

describe('registration-form API', () => {
  let app;
  let store;

  beforeEach(() => {
    store = new UserStore();
    app = createApp({ store });
  });

  it('GET /api/health reports ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  describe('POST /api/users', () => {
    it('creates a user, normalises the email and never returns the password', async () => {
      const res = await request(app).post('/api/users').send(valid).expect(201);
      assert.equal(res.body.id, 1);
      assert.equal(res.body.email, 'grace@example.com');
      assert.equal(res.headers.location, '/api/users/1');
      assert.ok(!('password' in res.body));
      assert.ok(!('passwordHash' in res.body));
    });

    it('stores a salted hash, not the plain password', async () => {
      await request(app).post('/api/users').send(valid).expect(201);
      const stored = await store.findById(1);
      assert.match(stored.passwordHash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
      assert.ok(!stored.passwordHash.includes(valid.password));
    });

    it('rejects missing and invalid fields with per-field messages', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: ' ', email: 'not-an-email', password: 'short' })
        .expect(400);
      assert.deepEqual(Object.keys(res.body.fields).sort(), ['email', 'name', 'password']);
    });

    it('requires the password to mix letters and numbers', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...valid, password: 'lettersonly' })
        .expect(400);
      assert.ok(res.body.fields.password);
    });

    it('rejects a duplicate email with 409', async () => {
      await request(app).post('/api/users').send(valid).expect(201);
      const res = await request(app)
        .post('/api/users')
        .send({ ...valid, email: 'grace@example.com' })
        .expect(409);
      assert.ok(res.body.fields.email);
    });

    it('returns 400 for malformed JSON', async () => {
      await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{"name":')
        .expect(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns the public profile of an existing user', async () => {
      await request(app).post('/api/users').send(valid).expect(201);
      const res = await request(app).get('/api/users/1').expect(200);
      assert.equal(res.body.name, 'Grace Hopper');
      assert.ok(!('passwordHash' in res.body));
    });

    it('returns 404 for an unknown ID', async () => {
      await request(app).get('/api/users/42').expect(404);
    });

    for (const bad of ['0', '-1', 'abc', '1.5']) {
      it(`returns 400 for invalid ID "${bad}"`, async () => {
        await request(app).get(`/api/users/${bad}`).expect(400);
      });
    }
  });

  it('GET /api/users lists users without password hashes', async () => {
    await request(app).post('/api/users').send(valid).expect(201);
    const res = await request(app).get('/api/users').expect(200);
    assert.equal(res.body.length, 1);
    assert.ok(!('passwordHash' in res.body[0]));
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope').expect(404);
    assert.equal(res.body.error, 'Not found.');
  });
});
