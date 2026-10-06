# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-06

A full rebuild of the original college project into a documented, tested full-stack app.

### Added

- `backend/`: Express 5 REST API (`POST /api/users`, `GET /api/users/:id`, `GET /api/users`, `GET /api/health`) with server-side validation, duplicate-email detection and salted `scrypt` password hashing.
- Registration form with reactive-form validation (required fields, email, password strength, password confirmation) and inline server errors.
- URL-driven user lookup page (`/lookup?id=…`).
- Backend tests (`node:test` + Supertest) and frontend tests (Vitest).
- GitHub Actions CI (backend on Node 20/22/24; frontend format check, tests, build).
- README, DEVELOPMENT guide, API reference, CONTRIBUTING guide, MIT license, screenshots.
- Root scripts to set up, run, test and build both packages; `.editorconfig`, `.gitattributes`, `.nvmrc`.

### Changed

- Restructured into a monorepo: `httpclient-demo/` → `frontend/` + `backend/`.
- Upgraded Angular 10 (NgModules, Zone.js, Karma, Protractor, TSLint) → Angular 21 (standalone components, signals, zoneless, Vitest, Prettier).
- Replaced the `localhost:5000/userbill/:id` endpoint with the `/api/users` resource behind a dev proxy.

### Removed

- Display of user passwords in the UI. Passwords are no longer returned by the API at all.
- Unused, non-compiling `DataserviceService`; empty `files.json`; Angular CLI boilerplate tests that never matched the app.

### Fixed

- Line-ending churn on Windows checkouts (normalised via `.gitattributes`).

## [0.1.0] - 2020-08-10

### Added

- Original Angular 10 `HttpClient` demo: a number input that fetched a user record by ID from a local backend and rendered it in a table.

[1.0.0]: https://github.com/imkarthiknr/registration-form/compare/a9b92a7...v1.0.0
[0.1.0]: https://github.com/imkarthiknr/registration-form/commit/a9b92a7
