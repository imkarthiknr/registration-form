import { hashPassword } from './password.js';

/**
 * In-memory user repository.
 *
 * Kept behind a small async interface (create / findById / findByEmail / list)
 * so it can be swapped for a real database without touching the routes.
 */
export class UserStore {
  #users = new Map();
  #nextId = 1;

  async create({ name, email, password }) {
    const user = {
      id: this.#nextId++,
      name,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    this.#users.set(user.id, user);
    return user;
  }

  async findById(id) {
    return this.#users.get(id) ?? null;
  }

  async findByEmail(email) {
    for (const user of this.#users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async list() {
    return [...this.#users.values()];
  }
}

/** Strip private fields (the password hash) before a user leaves the API. */
export function toPublicUser({ id, name, email, createdAt }) {
  return { id, name, email, createdAt };
}
