# Contributing

AIspy has been tested to work well in Claude Code. A change has to keep review quality and cost at
least as good, and add real value for the complexity it brings.

## Pull requests

- Start from an issue. Keep one issue, or one tightly related group, per pull request, and keep the
  change limited to what the issue asks.
- In the description, say what changed and why, which issue it closes, the full output of the
  checks below, and anything you're unsure about.

## Checks to run before a pull request

- `node --test scripts/checks/test/ scripts/capture/test/ scripts/inventory/test/` (all must pass).
- `node scripts/checks/check-deliverable.mjs <file>` for every HTML file in `examples/mareo/` and
  `examples/brolga/`.
- All six `skills/design-kit/*/tests/run.sh`, when anything under `skills/design-kit/` changed.

## Changes must not make reviews worse

- **Support for other tools (Codex, Cursor, ChatGPT and so on) is additive only.** Treat `skills/`
  (including `skills/design-kit/`), `scripts/` and `examples/` as read-only; the one exception is the
  release `version:` line in `skills/product-review/SKILL.md`. Put what another tool needs in new
  files. A tool that reads skills from its own folder gets `.agents/skills/`, with one symlink per
  skill pointing to the original, never copies. A new file must not change a Claude run.
- **If a tool can't work without changing a workflow file, stop** and open an issue saying what and
  why. Such a change needs a stage-by-stage comparison with the last Claude run on the Brolga example
  (findings, documents, mock) before release.
- **Script fixes change files on purpose.** Each does what its issue says and nothing else. Run the
  changed script or check from the latest release tag and from your branch on the same inputs, and
  explain every difference.
- `git diff --stat <latest tag> -- skills/ scripts/ examples/` shows what a branch changed in the
  workflow. For other-tools work it must be empty apart from the version line.

## Private material

- Never commit review output (`review/` is git-ignored), client files, or captures of real client
  sites.
- Don't name real clients or people in issues, pull requests, changelogs or other public text.

## Support position

AIspy is built and tested in Claude Code. Don't claim support for another tool until it has been
tested and documented.
