import { createApp } from './app.js';
import { UserStore } from './user-store.js';

const PORT = Number(process.env.PORT ?? 3000);
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA !== 'false';

const store = new UserStore();

if (SEED_DEMO_DATA) {
  await store.create({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'analytical1' });
  await store.create({ name: 'Alan Turing', email: 'alan@example.com', password: 'enigma1912' });
}

createApp({ store }).listen(PORT, () => {
  console.log(`registration-form API listening on http://localhost:${PORT}/api`);
});
