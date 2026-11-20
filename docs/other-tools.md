# AIspy in tools other than Claude Code

Claude Code is AIspy's supported and fully tested host. The integrations below are separate from
the Claude Code plugin and do not change its workflow.

## Codex CLI

Codex CLI can discover AIspy's eight skills directly from a clone. The repository keeps a flat
list of symlinks in `.agents/skills/`; each link points to the original skill in `skills/`, so
there is still only one copy to maintain.

### Install

You need Codex CLI, Node 22.23.5 or newer, Python 3 and Git. Clone the repository rather than
downloading a ZIP so the skill symlinks are preserved:

```sh
git clone https://github.com/stevensmith-design/aispy.git
cd aispy
codex
```

In Codex, run `/skills` and confirm these eight skills appear:

- `product-review`
- `review-scoping`
- `ui-design-system`
- `ui-design-review`
- `ia-review`
- `design-refine`
- `ui-design-principles`
- `distinctiveness-review`

Before the first review, install the screenshot helper:

```sh
cd scripts/capture
npm install
npx playwright install chromium
cd ../..
```

Then start a review from the repository root:

```text
Use the AIspy product-review skill to review https://example.com. Start separate agents for the
three lenses and the independent checks.
```

Codex can start the lens and check agents independently when the request or the skill asks it to.
In an interactive CLI session, `/subagents` shows their threads. The main thread collects their
results; the agents do not receive one another's conversation context. They should be given only
the shared review files and the inputs named by `product-review`.

If subagents are unavailable in a particular Codex environment, stop the review at the setup
check. Do not run the lenses together in the main context and call them independent. The fallback
is to run each lens or check in a fresh Codex session, give it only the inputs named by the skill,
save its result to the review folder, and return to the coordinating session after all results
exist.

### Windows

Windows is untested. Git must create real symlinks; do not replace them with copied skills. If a
normal clone checks out the links as plain files, enable Windows Developer Mode (or use a shell
with permission to create symlinks) and clone again with:

```powershell
git clone -c core.symlinks=true https://github.com/stevensmith-design/aispy.git
```

Confirm that `.agents/skills/product-review` is a symlink or junction before starting Codex.

## Cursor

Cursor is untested. AIspy does not currently claim Cursor support or provide a Cursor-specific
install. Do not copy the skills into a Cursor folder: that would create a second source of truth.

## ChatGPT in a browser

ChatGPT in a browser is untested and unsupported for a full AIspy run because it cannot operate
the repository's local capture, inventory, assembly and checking scripts. A manual review can use
uploaded screenshots and saved HTML, but it is not equivalent to the tested workflow and must not
be presented as an AIspy run.

## Current validation status

- Claude Code: supported; the complete workflow and examples are tested here.
- Codex CLI: repository skill discovery, independent subagents and the Node scripts are compatible;
  the required end-to-end Brolga comparison has not yet been completed.
- Cursor: untested.
- ChatGPT in a browser: untested and not supported for a complete run.

Codex's repository skill discovery and subagent behavior are documented in the official
[skills](https://learn.chatgpt.com/docs/build-skills) and
[subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) guides.
