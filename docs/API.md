# API Reference

Base URL (development): `http://localhost:3000/api`

All requests and responses use JSON. Errors always have this shape:

```json
{ "error": "Human-readable message.", "fields": { "email": "Per-field message (optional)." } }
```

## `GET /api/health`

Liveness check.

**200**

```json
{ "status": "ok" }
```

## `POST /api/users`

Register a new user.

**Request body**

| Field      | Type   | Rules                                                     |
| ---------- | ------ | --------------------------------------------------------- |
| `name`     | string | Required, trimmed, max 80 characters                      |
| `email`    | string | Required, valid email, trimmed and lower-cased, unique    |
| `password` | string | Required, min 8 characters, at least one letter and one digit |

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Grace Hopper","email":"grace@example.com","password":"cobol1959"}'
```

**201 Created**: the `Location` header points at `/api/users/{id}`.

```json
{ "id": 3, "name": "Grace Hopper", "email": "grace@example.com", "createdAt": "2026-10-06T07:30:00.000Z" }
```

| Status | When                                       |
| ------ | ------------------------------------------ |
| `400`  | Validation failed (`fields` lists each problem) or body is not valid JSON |
| `409`  | Email is already registered (`fields.email`) |
| `413`  | Body larger than 10 kB                     |

## `GET /api/users/:id`

Fetch a user's public profile. `id` must be a positive integer.

```bash
curl http://localhost:3000/api/users/1
```

**200**

```json
{ "id": 1, "name": "Ada Lovelace", "email": "ada@example.com", "createdAt": "2026-10-06T07:00:00.000Z" }
```

| Status | When                          |
| ------ | ----------------------------- |
| `400`  | `id` is not a positive integer |
| `404`  | No user with that ID          |

## `GET /api/users`

List all users (public fields only).

**200**

```json
[{ "id": 1, "name": "Ada Lovelace", "email": "ada@example.com", "createdAt": "…" }]
```

## Notes

- Passwords are hashed with salted `scrypt` and are **never** returned by any endpoint.
- Demo users (IDs 1 and 2) are seeded at start-up unless `SEED_DEMO_DATA=false`.
