<!-- Posting from the maintainer's account as an agent? Start with who wrote it, e.g. "**Codex:**".
     See CONTRIBUTING.md. Don't name real clients or people anywhere in this description. -->

## What and why

<!-- One short paragraph: what changed and why. -->

Closes #

## How this was verified

<!-- The checks in CONTRIBUTING.md that you actually ran, with their full output. -->

- [ ] `node --test scripts/checks/test/ scripts/capture/test/ scripts/inventory/test/ scripts/build/test/`
- [ ] `node scripts/checks/check-deliverable.mjs` on every HTML file in `examples/mareo/` and `examples/brolga/`
- [ ] All six `skills/design-kit/*/tests/run.sh` (only if `skills/design-kit/` changed)
- [ ] Script fixes: latest release tag and this branch run on the same inputs, every difference explained

```text
paste output here
```

## Workflow diff

<!-- Output of: git diff --stat <latest tag> -- skills/ scripts/ examples/
     For docs and other-tools work it must be empty apart from the version line. -->

```text
paste output here
```

## Not verified

<!-- What this change could break that the checks above can't see (a review run, a document's
     look, another agent's behaviour), and where a reviewer should look. "Nothing: <why>" is fine. -->

## Unsure about

<!-- Anything you're not sure of, or a decision the maintainer should make. -->
