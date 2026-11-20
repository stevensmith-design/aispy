# Repository instructions

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

## Release workflow

- Before a release, confirm the latest published version instead of assuming
  the version recorded in a handoff is still current.
- Bump the release version in all three places:
  - the `## Status` line in `README.md`;
  - `.claude-plugin/plugin.json`;
  - the `version:` field in the front matter of
    `skills/product-review/SKILL.md`.
- Add a matching `## 0.8.x` entry to `CHANGELOG.md`.
- Before every pull request, run and report:
  - `node --test scripts/checks/test/` (29 tests, all must pass);
  - `node scripts/checks/check-deliverable.mjs <file>` for every HTML file in
    `examples/mareo/` and `examples/brolga/`;
  - all six `skills/design-kit/*/tests/run.sh` scripts, but only when files
    under `skills/design-kit/` changed.
- Stop after opening the release pull request. The maintainer handles review,
  squash-merge, branch deletion, the annotated tag, and the GitHub release.
- In the pull request handoff, remind the maintainer that the eventual squash
  subject is `Release 0.8.x: <summary> (#N)` and that the GitHub release should
  be titled `AIspy 0.8.x`, use the matching changelog entry as its notes, and
  end with:

  `See the README for install and the two example packages in examples/mareo/ and examples/brolga/.`

## Product support position

- AIspy is currently built and tested in Claude Code only. The README and
  project website must say "for Claude Code".
- Do not claim support for Codex, Cursor, ChatGPT, or other agents until issue
  #13 is completed and tested.
- For issue #13, test one route from a clone by asking Codex to use the AIspy
  kit in `./aispy` to review `https://example.com`, stopping at the end of the
  setup check, and record what works and what fails.
- When issue #13 ships, also update the project website repository's
  `src/aispy/content.ts` and `src/home/content.ts` in both English and Japanese,
  following the instructions in the issue comment.

## Issue context

- Issues #20–#25 came from a code review of v0.8.1. Their file-and-line anchors
  are from v0.8.2 and may have shifted. Issues #24 and #25 include later
  comments with test results and additional points; read those comments before
  changing code.
- Issues #1–#11, #15, #18, and #19 are older backlog items. `ROADMAP.md`
  mirrors some, but GitHub is the source of truth.
- Using the kit and its scripts from Codex is itself evidence for issue #13.
