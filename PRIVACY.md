# Privacy model

CreatorDock is a local-first web application. Its core functionality does not require an account, server, analytics provider, advertising network, or paid service.

## What the app stores

The application stores one versioned workspace object in the current browser's local storage. It can contain project titles, briefs, dates, notes, tags, checklists, resource links, templates, and the selected appearance setting.

CreatorDock also uses a service worker cache for its static application files. The cache does not contain workspace records.

## What leaves the browser

CreatorDock does not transmit workspace data. The application has no telemetry or application network client.

A network request can still happen when you:

- open a resource link you added;
- initially load CreatorDock from a web host;
- reload to fetch an updated application build; or
- use browser features, extensions, or synchronization outside CreatorDock's control.

External resource links open in a new tab with referrer information suppressed.

## Backups

An exported JSON backup contains the full workspace in readable text. It is not encrypted. Store it somewhere appropriate for the sensitivity of the projects inside it.

Imports are parsed locally, limited to 2 MiB, validated field by field, and applied only after confirmation. Importing replaces the current workspace.

## Threat boundaries

CreatorDock does not protect data from someone who can access the same browser profile, device account, exported backup, or a compromised browser extension. Local storage is not an encrypted vault.

For sensitive work:

- use an operating-system account and browser profile protected by a strong sign-in method;
- avoid shared or public devices;
- keep the browser and operating system updated;
- review resource URLs before opening them; and
- protect or securely remove exported backups when no longer needed.

## Clearing data

The Settings screen can clear projects while retaining custom templates and appearance. To remove everything, clear the site's storage through the browser. Export a backup first if the data may be needed later.
