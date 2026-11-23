# Using AIspy with other agents

AIspy is designed for Claude Code. It also works with other agents that can read skills, run shell
commands and a browser, and start sub-agents, such as Codex.

## Codex

Open Codex in the `aispy` folder. It reads `AGENTS.md` automatically, which sets up the review the
way the kit expects. Then ask as you would in Claude Code:

```
Use the AIspy kit to review https://example.com. Start separate agents for the lenses and checks.
```

If you open Codex from a parent folder instead (your project, with `aispy/` inside it), add these
lines to your request:

```
Start each lens and each checker as a new agent with no conversation history.
Give checkers only the render and the report. Don't reuse an agent for a second role.
Stop and show me the mock spec before building the mock.
Read the reference examples in full (for Brolga's report and IA analysis, the sections you're building).
```
