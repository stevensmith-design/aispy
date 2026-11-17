# Security

## Reporting a problem
Please report security problems privately through GitHub's "Report a vulnerability" (Security →
Advisories) on this repository, not in a public issue.

## What the pack does and doesn't do
- It never asks for, types or stores credentials. For logged-in areas, you sign in yourself in
  the browser.
- It doesn't add to cart, enter personal or payment data, or publish anything.
- Review output (`review/`) can contain a client's material; it is git-ignored here. Keep it out
  of public repositories.
- The only third-party dependency is Playwright, for the optional capture scripts
  (`scripts/capture/`). Everything else runs on Node built-ins.
