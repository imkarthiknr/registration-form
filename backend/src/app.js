import express from 'express';
import { UserStore, toPublicUser } from './user-store.js';
import { parseId, validateRegistration } from './validation.js';

/**
 * Build the Express application. The store is injected so tests can use a
 * fresh instance per test case.
 */
export function createApp({ store = new UserStore() } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.get('/users', async (_req, res) => {
    const users = await store.list();
    res.json(users.map(toPublicUser));
  });

  api.get('/users/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'User ID must be a positive whole number.' });
    }
    const user = await store.findById(id);
    if (!user) {
      return res.status(404).json({ error: `No user found with ID ${id}.` });
    }
    res.json(toPublicUser(user));
  });

  api.post('/users', async (req, res) => {
    const { value, errors } = validateRegistration(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed.', fields: errors });
    }
    if (await store.findByEmail(value.email)) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        fields: { email: 'This email is already registered.' },
      });
    }
    const user = await store.create(value);
    res.status(201).location(`/api/users/${user.id}`).json(toPublicUser(user));
  });

  app.use('/api', api);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // Malformed JSON and any unexpected error end up here.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
