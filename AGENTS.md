# Repository instructions

AIspy is a skill pack that runs a UX, UI and IA review of a website or app and delivers a report,
an IA analysis, a mock and an index page.

## Running a review

- Follow `skills/product-review/SKILL.md`. It names the design-kit skills and scripts it uses; paths
  in it are relative to this folder.
- No install is needed to use the kit from this folder. Don't ask for `--plugin-dir` or `/plugin`.
  The only setup is the capture helper, which the setup check covers.
- Start each lens and each checker as a new agent with no conversation history (in Codex,
  `fork_turns: "none"`). Give checkers only the render and the report, not your notes, the spec's
  reasoning or other checks. Don't reuse an agent for a second role.
- After writing the mock spec, stop and show it to the person before building the mock. A general
  "go ahead" for the mock doesn't approve the spec.
- Read the reference examples `SKILL.md` names in full, not only their headings. For Brolga's
  report and IA analysis, read the sections you're building, as `SKILL.md` says.

## Changing this repository

Before changing the kit itself (its skills, scripts, templates, docs, examples or README), read
`CONTRIBUTING.md` and follow it. Maintainers: also read `MAINTAINING.local.md` if it exists (it
isn't part of the repository). Running a review doesn't count, including writing its output to
`review/`: a review doesn't need either file.
