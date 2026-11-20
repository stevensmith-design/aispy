# Maintaining this repository

Rules for anyone (person or agent) changing this repository. Not needed to run a review.

## Project and issue workflow

- This repository is public. Work through the open GitHub issues shown by
  `gh issue list`; do not rely only on `ROADMAP.md`.
- `main` is protected by the `Protect main` ruleset. Never push directly to
  `main` and never force-push.
- Make every change on its own branch and submit it through a pull request.
  Use a focused branch name such as `release/0.8.7` or `fix/<issue>`.
- Keep each change minimal and limited to what its issue asks for.
- Only create branches, commits, and pull requests. Never merge a pull request,
  create a tag, or create a release, even if asked to do so during a task. A
  separate Claude Code review happens first, and the maintainer merges.
- Keep one issue, or one tightly related group of issues, per pull request.
- Every pull request description must include:
  - what changed and why;
  - the issue it closes;
  - the full output of every required check;
  - anything that remains uncertain.
- In GitHub issues, pull requests, changelogs, and other public text, do not
  name the reference review's client or real people.
- Never commit reference or private material (the reference review, client files, captures of
  real client sites). Before a release, run `check-deliverable.mjs --forbid "<names>"` on the
  example documents, with the private names the maintainer gives you; never write that list
  into the repository.

## Release workflow

- Before a release, confirm the latest published version instead of assuming
  the version recorded in a handoff is still current.
- Bump the release version in all three places:
  - the version on the line under `## Status` in `README.md`;
  - `.claude-plugin/plugin.json`;
  - the `version:` field in the front matter of
    `skills/product-review/SKILL.md`.
- Add a matching `## X.Y.Z` entry to `CHANGELOG.md`.
- Before every pull request, run and report:
  - `node --test scripts/checks/test/` (all tests must pass);
  - `node scripts/checks/check-deliverable.mjs <file>` for every HTML file in
    `examples/mareo/*.html` and `examples/brolga/*.html`;
  - all six `skills/design-kit/*/tests/run.sh` scripts, but only when files
    under `skills/design-kit/` changed.
- Stop after opening the release pull request. The maintainer handles review,
  squash-merge, branch deletion, the annotated tag, and the GitHub release.
- In the pull request handoff, remind the maintainer that the eventual squash
  subject is `Release X.Y.Z: <summary> (#N)` and that the GitHub release should
  be titled `AIspy X.Y.Z`, use the matching changelog entry as its notes, and
  end with:

  `See the README for install and the two example packages in examples/mareo/ and examples/brolga/.`

## Changes must not make reviews worse

What's here has been tested to work well. A change has to keep review quality and cost at least
as good, and add real value for the complexity it brings.

- **Other-tools work (Codex, Cursor, ChatGPT and so on) is additive only.** Treat `skills/`
  (including `skills/design-kit/`), `scripts/` and `examples/` as read-only; the one exception
  is the release `version:` line in `skills/product-review/SKILL.md`. Put what another tool needs
  in new files (install notes, tool folders). A tool that reads skills from its own folder gets
  `.agents/skills/` with one symlink per skill pointing to the originals, never copies. A new
  file must not change a Claude run.
- **If a tool can't work without changing a workflow file, stop** and open an issue saying what
  and why. The maintainer decides. Any such change needs a stage-by-stage comparison with the
  last Claude run on the Brolga example (findings, documents, mock) before release.
- **Issue fixes change files on purpose.** Each fix does what its issue says and nothing else, and
  is compared before and after: run the changed script or check from the latest release tag and
  from the branch on the same inputs, and explain every difference.
- **Before each release**, run `git diff --stat <latest tag> -- skills/ scripts/ examples/`. For
  other-tools work it must show nothing beyond the version line. Anything else needs the
  comparison above.

## Product support position

- AIspy is built and tested in Claude Code only. The README and the project website say
  "for Claude Code".
- Don't claim support for other agents (Codex, Cursor, ChatGPT and so on) until it has been
  tested and documented.
