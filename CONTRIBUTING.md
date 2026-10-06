# Contributing

Thanks for your interest in improving this project!

## Reporting issues

Open an [issue](https://github.com/imkarthiknr/registration-form/issues) with:

- what you expected and what happened,
- steps to reproduce,
- your OS, Node.js and browser versions.

## Making changes

1. Fork the repo and create a branch from `master`: `git checkout -b feat/short-description`.
2. Follow [DEVELOPMENT.md](DEVELOPMENT.md) to set up and run the project.
3. Make your change **with tests**.
4. Make sure everything passes locally:

   ```bash
   npm test
   npm run format:check
   npm run build
   ```

5. Commit using [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add phone number field`.
6. Open a pull request describing **what** changed and **why**. Add screenshots for UI changes.

## Guidelines

- Keep pull requests focused on one change.
- If you change API behaviour, update [docs/API.md](docs/API.md).
- Never log, return or store plain-text passwords.
