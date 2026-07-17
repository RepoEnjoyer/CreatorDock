# AI handoff

This document gives another AI developer enough context to continue CreatorDock without reverse-engineering its intent.

## Product boundary

CreatorDock is a local-first browser workspace for planning and shipping creative projects. Version 1.0 deliberately has no account, backend, analytics, advertising, remote font, third-party script, or application network client. Preserve that boundary unless a future feature is explicitly opt-in and the offline core remains complete.

## Architecture

- `src/types.ts` defines the versioned workspace, project, checklist, resource, template, theme, and view types.
- `src/domain.ts` contains pure helpers, built-in templates, date calculations, draft conversion, and progress rules.
- `src/storage.ts` owns local persistence, backup serialization, size limits, URL safety, and untrusted import validation.
- `src/workspace.ts` is the pure reducer for all workspace mutations.
- `src/App.tsx` coordinates views, persistence, theme state, modals, notifications, and keyboard shortcuts.
- `src/components/` contains the dashboard, pipeline, calendar, templates, project editor, settings, navigation, cards, and inline icon system.
- `src/styles.css` contains the complete responsive visual system and theme tokens.
- `public/sw.js` provides a small same-origin application-shell cache for offline use.

The application state is one `Workspace` object. React's reducer applies actions, and an effect writes the resulting object to the `creatordock.workspace.v1` local-storage key. An exported backup wraps the same validated data with a format identifier and timestamp.

## Important decisions

1. **No router:** Four primary views are lightweight client state, so a routing dependency would not improve version 1.0.
2. **No state library:** The pure reducer is sufficient, directly testable, and keeps persistence explicit.
3. **No component library:** Native elements and a small local icon set minimize dependencies and make accessibility behavior visible.
4. **Built-ins are canonical:** Imported backups retain custom templates, but built-in templates come from application code. This prevents an import from silently redefining trusted defaults.
5. **Links are constrained:** Only complete HTTP and HTTPS resource URLs are accepted. Links open with referrer suppression.
6. **Readable backups:** Portability is prioritized over opaque storage. Backups are not encrypted, and the interface and privacy documentation say so clearly.
7. **Relative production paths:** Vite's base is `./`, allowing static subdirectory hosting.

## Security and privacy invariants

- Treat backup content as untrusted input.
- Keep import size and collection-count limits bounded.
- Do not render imported HTML or use raw HTML injection.
- Do not add network calls, telemetry, external assets, or hosted dependencies silently.
- Preserve `rel="noreferrer"` on external links.
- Keep publication-hygiene tests passing and manually review new fixtures for identifying data.
- Never commit local paths, credentials, real private links, personal data, environment files, or copied production content.

## Tests and verification

Vitest suites cover:

- initial state, template drafts, copying, date grids, overdue rules, and progress;
- backup round trips, malformed and oversized imports, unsafe protocols, duplicate IDs, canonical built-ins, and storage failures;
- project and template reducer actions, immutable updates, duplication, replacement, and clearing; and
- public authorship plus common path, private-key, and secret-assignment patterns.

`npm run check` runs ESLint, strict TypeScript, all tests, and the production build. CI runs that command on supported Node versions.

## Current limitations

- Browser local storage is not encrypted and is tied to one browser profile.
- There is no synchronization or conflict resolution between devices.
- Calendar items use target dates only and do not include reminder times.
- Drag-and-drop is intentionally supplemented by selects, but automated browser accessibility coverage is still a roadmap item.
- The service worker is intentionally simple and has no custom update prompt.
- Backup format version 1 has no migration registry yet. Add one before introducing a breaking schema version.

## Sensible next steps

1. Add project archiving as a reducer action, filtered view, tests, and backup-compatible field with a migration default.
2. Add browser-level tests for keyboard project creation, modal focus behavior, pipeline status changes, import errors, and theme persistence.
3. Design optional encrypted file export with Web Crypto, clear recovery warnings, authenticated encryption, and no server involvement.

Read `CONTRIBUTING.md`, `PRIVACY.md`, `SECURITY.md`, and `ROADMAP.md` before expanding scope.
