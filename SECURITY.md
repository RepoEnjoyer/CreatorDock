# Security policy

## Supported versions

Security fixes are applied to the latest version on the default branch.

| Version | Supported |
| --- | --- |
| Latest `1.x` | Yes |
| Older versions | No |

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public issue.

Use GitHub's **Security** tab and select **Report a vulnerability** to send details privately. Include the affected version, reproduction steps, impact, and any suggested mitigation. If private reporting is temporarily unavailable, open a public issue that only asks the maintainer to enable a private reporting channel. Do not include vulnerability details in that issue.

You should receive an acknowledgement through GitHub within seven days. Confirmed reports will be assessed, fixed proportionally to their impact, and credited in the release notes if the reporter wants public credit.

## Scope

Useful reports include:

- backup validation bypasses;
- script execution or unsafe URL handling;
- unintended data transmission;
- service worker cache issues with a security impact;
- dependency vulnerabilities that are reachable in CreatorDock; and
- privacy regressions that expose workspace content.

General feature requests and non-sensitive bugs belong in the public issue tracker.
