# Using AIspy with other agents

AIspy is built and tested in Claude Code. It has also been tested, unchanged, in Codex. Other
agents (Cursor, ChatGPT and so on) are untested.

## Codex

**Tested in November 2026** with AIspy 0.8.6, from a fresh clone with no changes to the kit, in
three runs:
- a two-page landing page;
- the Brolga test store;
- a frozen localisation review.

Each run had its own example removed from the clone, so it couldn't copy the answer.

**What worked without changes:**
- Codex found and followed `skills/product-review/SKILL.md`, the six design-kit skills, the
  templates and the scripts.
- Capture, the design-system extraction and research ran.
- The three lenses ran as separate agents, and the report, IA analysis and mock passed
  `check-deliverable.mjs`.
- It stopped for review after the report and after the mock.

**Results against Claude runs of the same reviews:**
- **Brolga:** about 11 of roughly 15 findings in scope.
- **The frozen localisation review:** 9 of its 13 findings, 3 more in part, and 1 missed.
- **Research:** shorter, with fewer consumer-behaviour figures, but every source official and dated.
- **Documents and mock:** findings and research were close to the Claude standard. The final
  documents and the mock were weaker and needed a design review.

**What differed in Codex,** now covered by `AGENTS.md`, which Codex reads automatically:
- **Lens agents inherited the whole conversation.** They were separate but not independent. In two
  runs the first checkers did too. `AGENTS.md` asks for each lens and checker to start with no
  history (`fork_turns: "none"`), to get only the render and the report, and for no agent to be
  reused for a second role.
- **The mock-spec approval stop was skipped.** A general "go ahead" was taken as approval of the
  spec. Claude runs have done the same.
- **The reference examples were skimmed** rather than read in full. Claude runs have done the same.

**Environment:** browser and network restrictions needed retries and approvals, and Codex wrote its
own helper scripts to work around them. No kit changes were needed.

### Starting a review in Codex

Open Codex **in the `aispy` folder**, so it reads `AGENTS.md`, and ask as you would in Claude Code:

```
Use the AIspy kit to review https://example.com. Start separate agents for the lenses and checks.
```

If you open Codex in a parent folder instead (your project, with `aispy/` inside it), it may not
read `aispy/AGENTS.md`. Add these lines to the request:

```
Start each lens and each checker as a new agent with no conversation history.
Give checkers only the render and the report. Don't reuse an agent for a second role.
Stop and show me the mock spec before building the mock.
Read the reference examples in full.
```
