# Changelog

Versions before 0.7.0 were private; their notes are kept here as the design history. "The
reference review" is the senior designer's review the pack was built to replicate and is
measured against.

## 0.7.0 (first public release)

- Released as **AIspy** (previously the working name product-review-pack). The skill names are unchanged.
- Installs into Claude Code with `/plugin` or from a clone with `--plugin-dir` (manifests in `.claude-plugin/`).
- The six design-kit skills the pack calls are bundled in `skills/design-kit/` (Agentic Design Kit 2.0.2), so one install is enough. See `skills/design-kit/PROVENANCE.md`.
- `product-review` notes where the bundled kit and the pack's scripts live.
- Example package: Brolga JP, a localisation review of a fictional running-shoe brand (`examples/brolga/`).
- `docs/how-to-use.md`: what to provide for each kind of product, and what to expect.
- Node 22.23.5 or newer for the capture scripts.

## 0.6.10

Each mock note reads Now (the problem) / Proposed (the change and why; "removed, because …" for a removal), one line each; check-mock enforces it.

## 0.6.9

The mock stays focused (about 10–15 changes, one marker per change with the finding's own number, no sub-markers, a short header); check-mock enforces it. From comparing run 11's mock (36 notes) with the reference (14).

## 0.6.8

From the reference session's variance test: a live-values file at capture (prices per size, counts, spec values, fees) used by the report and mock; mock rules to keep the client's own assets, use its tokens for states (new ones labelled proposed), no text under 12 px on the decision path, and say so when the brand font can't load. The rest of its handover was already in the pack.

## 0.6.7

Mock markers on both sides (current = the problem as it is now, proposed = the change), checked by check-mock; reference patterns are a minimum to match, not a limit.

## 0.6.6

Mock spec before the mock (one row per change: finding, the local reference pattern it adapts, exact content, position, component), approved by the person, then checked against the built mock; a supplied reference mock sets the quality bar. From the reference session's own account of why its mock worked.

## 0.6.5

Grouping never hides a problem (titles name every problem, a High part makes the group High, the most visible instance is the evidence, separate decisions stay separate); shorter writing (one sentence per grouped point, 3–4 proposal lines); no text labels on screenshots, the caption explains; Japan notes add points to the payment set and the product name as the first place to check line breaks.

## 0.6.4

Findings are grouped like the reference review: 12–15 main findings, each merging problems that share a cause or a fix, then a compact further-findings table; the check fails more than 15 cards in the by-issue layout. Crops display at their crop size (a 2x bug fixed); markers sit above the outline; 12 px text floor; one priority scale in the IA analysis; phone nav on one line.

## 0.6.3

From the reference review's lens rerun: High priority also covers the client's stated goals (not only the key task); four structural questions the IA lens missed (each page type's job, routes to try the product, the DOM heading outline, checkout options at the product page). Extraction takes rendered values, the most-used where near-identical values compete.

## 0.6.2

Asks for the go-ahead to start agents (sessions often won't start them unasked); a setup check before the review (agents, browser, screenshots, kit); a failed check stops the run instead of continuing in a reduced, non-independent mode. "Review only" requests stop after step 6.

## 0.6.1

Closes the gaps found in the first 0.6.0 run against the baseline. Evidence is cropped and annotated the baseline's way (`annotate.mjs` rewritten: crop, outline, number, label; shown at crop size; the check fails whole-screen or unmarked evidence). Restored baseline parts the templates had dropped: IA "Additional findings", a screenshot inside a task card where it explains the friction, the page-length diagram, the optional "who led it" block. Added the run 5 top summary (screens reviewed and the findings tally). New by-page report template from run 5's page-by-page version. Fixed a style clash that broke the About table.

## 0.6.0

Templates for the four documents, built from the baseline's HTML and component system with the agreed run 5 and 6 additions (page layout by type with role tags and shares, heading hierarchy, label audit, proposed structure with reasons, buy-area side-by-side table). The client's brand is applied through one theme file; research and judgement stay free. New scripts: theme from tokens, assemble, layout bars, template check. The patterns sheet is archived in `_archive/v0.5/`.

## 0.5.0

Rebuilt against the full baseline document and the review guideline: review questions by lens (nine categories, coverage recorded at synthesis), use case per page in the frame, required sections, findings ordered by where users meet them, concrete-change proposals, task equivalence, evidence vs proof of impact, more Japan notes, shopping decision-screen building blocks, lenses investigate everything, budget as a reference.

## 0.4.3

Baseline items restored after an outside review (third stop before packaging, index outline, shared document layout, 4-6 benchmarks with roles and measurements, 3 brands outside the category, every finding re-checked live, version comparison and _archive, no other client's content, guideline coverage check, step counts on task paths, mock toggle, IA markers and trade-offs), localisation-only sections marked, desktop and app routes, capture helper captures each page as a first visit with a 15 s wait.

## 0.4.2

Visual patterns sheet (IA sections and mock), mock as one scrollable phone per side with markers on the elements, "If HQ asks", two-way global cross-check, phased next steps with A/B hypotheses, "done well in this market" on every High/Medium finding, every lens finding accounted for, fact and design checks on reports and mock, firm phase-1 stop, supplied review start, optional supplied review guideline.

## 0.4.1

Report and IA analysis outlines (`references/deliverables.md`), by-issue or by-page layout, and checklist fixes from run 5 (live checks with third-party scripts, mandatory labels, decision-area severity, sweep accounted for, contradictions checked, phase times logged).

## 0.4.0

Rebuilt to replicate the baseline review workflow. The mock is designed as one screen around the user's decision, with `ui-design-principles` loaded and two independent reviews (`ui-design-review`, `distinctiveness-review`) saved as files. Unknown values are realistic simulated data marked illustrative; a placeholder only for money, legal terms or commitments. v0.3 parts are in `_archive/v0.3/` for comparison only.
