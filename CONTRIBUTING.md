# Contributing to CreatorDock

Thanks for helping make CreatorDock calmer, safer, and more useful.

## Before you begin

- Search existing issues and pull requests to avoid duplicate work.
- Open a feature request before a large behavioral or architectural change.
- Keep the core usable without an account, paid service, or hosted backend.
- Do not add analytics, tracking, remote fonts, or third-party scripts.
- Never commit real project data, credentials, private links, personal paths, or identifying information.

Security vulnerabilities follow [SECURITY.md](SECURITY.md), not the public issue tracker.

## Development

Requirements: Node.js 20.19 or newer and npm.

```bash
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run check
npm audit
```

## Design principles

1. **Local-first by default.** Workspace content stays on the user's device.
2. **Useful before configurable.** Good defaults should cover the normal workflow.
3. **Calm over crowded.** New controls need a clear everyday purpose.
4. **Accessible without drag and drop.** Every action needs a keyboard-friendly path.
5. **Portable data.** Users must retain a readable export of their work.
6. **Small dependency surface.** Add a package only when it provides durable value.

## Pull requests

Keep changes focused and use a descriptive title. Include:

- the problem and chosen approach;
- screenshots for visible interface changes;
- tests for changed domain or storage behavior;
- accessibility and privacy considerations; and
- documentation updates when behavior changes.

Do not include generated `dist`, coverage, cache, editor, or dependency directories.

## Commit style

Use short, imperative messages with a conventional prefix when practical:

- `feat:` user-facing capability
- `fix:` bug fix
- `docs:` documentation only
- `test:` test coverage
- `refactor:` internal change without new behavior
- `chore:` maintenance

By contributing, you agree that your work will be licensed under the repository's MIT License.
