# Development Guide

This guide covers everything needed to work on the project locally: setup, architecture, conventions, testing and the roadmap. For a project overview, see the [README](README.md).

- [Prerequisites](#prerequisites)
- [Getting set up](#getting-set-up)
- [Running the app](#running-the-app)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Testing](#testing)
- [Code style](#code-style)
- [Continuous integration](#continuous-integration)
- [Common tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

## Prerequisites

| Tool    | Version                                     |
| ------- | ------------------------------------------- |
| Node.js | `^20.19.0`, `^22.12.0` or `>=24` (`.nvmrc` pins 22) |
| npm     | 10+ (bundled with Node)                     |
| Git     | any recent version                          |

With [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows), run `nvm use` in the repo root.

You do **not** need a global Angular CLI. Use `npx ng …` inside `frontend/`, or the npm scripts.

## Getting set up

```bash
git clone https://github.com/imkarthiknr/registration-form.git
cd registration-form
npm install      # root dev tooling (concurrently)
npm run setup    # npm ci in backend/ and frontend/
```

The repository is a simple two-package monorepo. `backend/` and `frontend/` each have their own `package.json` and lockfile, and the root `package.json` only holds convenience scripts.

## Running the app

### Both together (recommended)

```bash
npm run dev
```

| Service | URL                         | Notes                                   |
| ------- | --------------------------- | --------------------------------------- |
| Web app | http://localhost:4200       | Angular dev server with live reload     |
| API     | http://localhost:3000/api   | `node --watch` restarts on file changes |

The Angular dev server proxies every `/api/*` request to the API (`frontend/proxy.conf.json`). The browser only talks to one origin, so CORS is never needed in development.

### Separately

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

## Configuration

The backend reads these environment variables:

| Variable         | Default | Description                                                |
| ---------------- | ------- | ---------------------------------------------------------- |
| `PORT`           | `3000`  | Port the API listens on                                    |
| `SEED_DEMO_DATA` | `true`  | Set to `false` to start with an empty user store           |

```bash
PORT=4000 SEED_DEMO_DATA=false npm start --prefix backend
```

If you change the API port, update `target` in `frontend/proxy.conf.json` to match.

The frontend has no runtime configuration. It always calls the relative path `/api`, so in production you serve the built app and the API behind the same origin (for example with a reverse proxy).

## Architecture

```
 Browser                      Angular dev server (:4200)           Express API (:3000)
┌──────────────┐  /api/*     ┌────────────────────────┐  proxy    ┌──────────────────────┐
│ RegisterComp │ ──────────▶ │ serves SPA + proxies   │ ────────▶ │ /api router          │
│ LookupComp   │ ◀────────── │ /api to the backend    │ ◀──────── │  ├─ validation.js    │
│   └ UserService (HttpClient)                       │           │  ├─ user-store.js    │
└──────────────┘             └────────────────────────┘           │  └─ password.js      │
                                                                  └──────────────────────┘
```

### Backend (`backend/`)

- **`app.js`** exports `createApp({ store })`, a factory that builds the Express app. The store is injected, so tests get a fresh, isolated instance per case and never open a real port (Supertest drives the app directly).
- **`user-store.js`** is an in-memory `UserStore` with an async interface (`create`, `findById`, `findByEmail`, `list`). The async interface is deliberate: swapping in a database-backed implementation needs no route changes. `toPublicUser()` is the single place that decides which fields leave the API.
- **`validation.js`** holds pure functions with no Express dependency, which keeps them easy to unit test. Emails are trimmed and lower-cased before the uniqueness check.
- **`password.js`** does `scrypt` hashing from `node:crypto` with a random 16-byte salt per password, stored as `scrypt$<salt>$<hash>`. Verification uses `timingSafeEqual`. There are no native dependencies, so it installs cleanly on any OS.
- **Error handling**: unknown routes return a JSON `404`, malformed JSON returns `400`, bodies over 10 kB return `413`, and anything else is logged and returns a generic `500`. Stack traces never reach the client.

Request and response shapes are documented in [docs/API.md](docs/API.md).

### Frontend (`frontend/`)

```
src/app/
├── core/                       App-wide singletons and types
│   ├── models/user.model.ts    User, RegistrationRequest, ApiError
│   ├── services/user.service.ts
│   └── http-error.ts           HttpErrorResponse → user-facing message
├── features/                   One folder per route, lazy-loaded
│   ├── register/
│   └── lookup/
├── shared/validators/          Reusable ValidatorFns
├── app.config.ts               Providers (router, HttpClient with fetch)
├── app.routes.ts               Route table
└── app.ts / app.html           Shell: header + nav + <router-outlet>
```

Key decisions:

- **Standalone components, zoneless change detection, signals for view state.** There are no NgModules and no Zone.js.
- **Feature routes are lazy-loaded** with `loadComponent`, so each page is its own small chunk.
- **The lookup page is URL-driven.** Submitting the form only updates `?id=`. The component reacts to `queryParamMap`, and `switchMap` cancels stale requests. This gives shareable links and correct back-button behaviour for free.
- **Server errors map to form fields.** When the API returns `fields: { email: "…" }`, `RegisterComponent` sets a `server` error on that control, so the message appears in the same spot as client-side validation.
- **`confirmPassword` is UI-only** and is never sent to the API.

## Testing

```bash
npm test                         # everything, from the repo root

cd backend  && npm test          # node:test + Supertest
cd frontend && npm test          # Vitest (single run)
cd frontend && npm run test:watch
```

| Suite    | Runner                 | What's covered                                                                 |
| -------- | ---------------------- | ------------------------------------------------------------------------------ |
| Backend  | `node:test` + Supertest | Every endpoint, including validation, duplicate email, ID parsing, malformed JSON, hash storage and password verification |
| Frontend | Vitest (jsdom) via `@angular/build:unit-test` | `UserService` HTTP calls, both validators, registration flow (client errors, payload shape, server field errors), lookup (URL-driven loading, 404, invalid IDs) |

Guidelines:

- Backend tests create their own `UserStore` in `beforeEach`, so tests never share state.
- Frontend HTTP tests use `provideHttpClientTesting()` and call `HttpTestingController.verify()` in `afterEach`, which fails a test on any unexpected request.
- Prefer testing through the DOM (fill inputs, submit the form) over calling component methods directly.

## Code style

- **Formatting**: Prettier, configured in `frontend/.prettierrc` (100-column lines, single quotes). Run `npm run format --prefix frontend` before committing. CI runs `format:check`.
- **Whitespace**: the root `.editorconfig` sets 2-space indentation, UTF-8 and a final newline.
- **Line endings**: `.gitattributes` stores everything as LF. Windows checkouts convert automatically, so you shouldn't see whole-file "modified" diffs.
- **TypeScript** runs in `strict` mode with `strictTemplates`. Avoid `any`.
- **Commits** use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`).

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `master` and on every pull request:

| Job      | Steps                                                         |
| -------- | ------------------------------------------------------------- |
| Backend  | `npm ci` → `npm test`, on a Node 20 / 22 / 24 matrix          |
| Frontend | `npm ci` → `format:check` → `npm test` → `npm run build` (Node from `.nvmrc`) |

## Common tasks

**Add a field to registration (e.g. `phone`)**

1. Backend: validate it in `validation.js`, persist it in `UserStore.create`, expose it in `toPublicUser` if it's public, and add tests.
2. Frontend: add it to `RegistrationRequest` and `User` in `user.model.ts`, then add the control and template block in `register.component.*` and a spec case.
3. Update [docs/API.md](docs/API.md).

**Add a page**

```bash
cd frontend
npx ng generate component features/<name>
```

Then register it in `app.routes.ts` with `loadComponent` and add a nav link in `app.html`.

**Replace the in-memory store with a database**

Implement a class with the same four async methods as `UserStore`, then pass it to `createApp({ store })` in `server.js`. Routes and tests stay the same.

## Troubleshooting

| Symptom                                               | Fix                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| UI says *"Cannot reach the server. Is the API running?"* | Start the backend (`npm run dev --prefix backend`) and check it is on the port in `proxy.conf.json`. |
| `EADDRINUSE: address already in use :::3000`          | Another process holds the port. Stop it or run with `PORT=3001` and update the proxy.     |
| `The Angular CLI requires a minimum Node.js version`  | Upgrade Node (see [Prerequisites](#prerequisites)) or run `nvm use`.                        |
| `npm error Cannot read properties of null (reading 'edgesOut')` on `npm install` | A known npm 10 bug when resolving a fresh tree. Use `npm ci` (lockfiles are committed) or `npx npm@11 install`. |
| Users disappear after restarting the API              | Expected. The store is in memory. See the roadmap.                                        |

## Roadmap

- [ ] Persistent storage (SQLite via `node:sqlite`, or PostgreSQL) behind the `UserStore` interface
- [ ] Login with sessions or JWT, and restrict lookups to the signed-in user
- [ ] Rate limiting and security headers (`helmet`) on the API
- [ ] OpenAPI spec generated from the routes, served at `/api/docs`
- [ ] End-to-end tests with Playwright
- [ ] Dockerfile and `docker compose up` for one-command startup
- [ ] Deploy a live demo
