# Changelog

Versions before 0.7.0 were private; their notes are kept here as the design history. "The
reference review" is the senior designer's review the pack was built to replicate and is
measured against.

## Unreleased

- `SKILL.md` Phase 2.2 (#46): a general "go ahead", "make the mock" or approval of the report doesn't approve the mock spec; the agent shows the table and asks. It builds without an answer only if the person said up front they won't be there, noted in the run log.
- `SKILL.md` step 4 (#47): research covers the user behaviour the findings lean on, where official or large-sample data exists (delivery, payment methods, how reviews are used, trust signals), and says so where a topic has no usable data. Topics, not a length.
- `SKILL.md` step 5 (#11): the grouping examples are marked as coming from a Japanese-market review, with one general example added.
- `SKILL.md` steps 5 and 7.4, `templates/README.md`, `README.md` (#25): lens reports stay one file per lens and only the synthesis combines them, naming each item's source lens and putting disagreements to the person; names the run cites are no longer on the `--forbid` list; the evidence height limit reads 520 px, as the check enforces; README timings match `SKILL.md`; `scripts/` are described as helpers the workflow runs.
- `templates/ia.html` (from #2): a `.lead` line under the label audit.
- `SKILL.md` Phase 3 (#83): packaging is no longer a stop of its own. It still runs only after the person's review of the mock, with the same checks, then hands over the package with a short note, matching the three stops in the docs.
- `README.md` and `docs/how-to-use.md` (#79): the source project of a staging or local site is welcome, since it helps the analysis and the design-system extraction; the docs no longer say to withhold it. AIspy still reviews the pages as they render.
- `README.md` and `docs/how-to-use.md` (#80): the three stops are after the report and IA analysis, after the mock spec, and after the mock, as on the website. Packaging (the index page and final package, when the review goes out) is no longer listed as a stop; `SKILL.md` Phase 3 still stops there, which is #83. Stop timings now follow `SKILL.md`'s reference table (report about 50 minutes, IA analysis about 55, mock about 20 per round).
- `SKILL.md` steps 1, 3 and 5, and `references/deliverables.md` (#85): when the team supplies brand guidelines or a design system, however partial, the review still extracts the live site and merges the two: specified values win, gaps are filled from the site, and nothing is guessed. The UI lens checks the screens against the specified values only. Scattered drift (one role, several values) is an ordinary finding; a specified value the site replaces everywhere with one other value becomes a question for the client ("which is current?"), and the site's value stays in the theme until they answer. The report lists what the guidelines don't cover in A3. An earlier AIspy extraction still skips steps 2–3. Reviews without supplied guidelines are unchanged. Checked with a targeted run (steps 1–3 and the UI lens) on a fictional brand with a partial guideline; part of the #73 comparison-run batch.

## 0.8.11

- `SKILL.md` "Before you start", setup check only (#66, #67): when check 3 fails only because the capture helper isn't installed (no `scripts/capture/node_modules`), the agent offers to install it, in the same message as the agents question when both are open. After a yes, it runs `npm install` and `npx playwright install chromium` in the pack's `scripts/capture/` and re-runs check 3. A decline or a failed install means check 3 has failed, and the review stops as before. Checked with two setup-only Claude runs on fresh clones (approve: installs, all four checks pass; decline: stops). No Brolga comparison, since nothing after the setup check changed.
- `layout-bars.mjs` (#23, #64): a section that overlaps another by more than 0.05 screens (a nested element listed beside its parent) is now an input error, so shares can no longer sum past 100%. Output for valid input is byte-identical. Tests: `node --test scripts/build/test/`.
- `check-deliverable.mjs` (#22, #65):
  - `--forbid` also checks the values of `alt`, `title`, `aria-label`, `aria-description`, `placeholder` and `data-*` attributes, not only the visible text.
  - An index fails when a link to another document doesn't resolve beside it, for example when `assemble.mjs` ran without `--names`.
  - Results on the examples are unchanged, apart from one new `✓ linked documents present` line on each index.
- `README.md` and `docs/how-to-use.md` (#24, #63): how to connect a browser. Any browser the session can drive works for a public site. Claude in Chrome is for logged-in areas and for sites that block scripted browsers; the docs give its connection steps and how to confirm them.

## 0.8.10

- `SKILL.md` "Before you start", wording only (#8, #9, #10, #25 item 1, #61):
  - the setup check asks for the go-ahead to start agents now, before intake, instead of "at intake", which came after it;
  - if the product isn't settled at setup, the review folder is named from the site's URL and keeps that name for the whole run; in a terminal session, "the folder the person connected" is the folder Claude was started in;
  - the kit skills are the copies in `skills/design-kit/` (from the pack root), used by path rather than same-named skills installed elsewhere. The undefined "install or lock check" sentence, which said to carry on where the setup check says to stop, is removed.
- `README.md` and `docs/how-to-use.md` (#61): the setup check comes before the intake questions, matching `SKILL.md`.
- `assemble.mjs` (#53, #59): an `@2x` image that already has a `style` attribute gets the width added at the start of that attribute instead of a second `style`, which the browser ignored. Only real `style` attributes are changed: text like `style='…'` inside an `alt` or `title` is left alone. Tags without a `style` are unchanged. First tests for `scripts/build/`: `node --test scripts/build/test/`, now part of the test command in `CONTRIBUTING.md`.
- `check-report.mjs` (#58, #60): with `--old`, a document without language templates is now compared with the `en` template of a bilingual version (or the first template if there's no `en`), not only with a single-template version, so a finding removed in that case is reported. The output says which template it compared with. Other languages are still a note. Tests: `node --test scripts/checks/test/`.

## 0.8.9

Script fixes only; `skills/` and `examples/` are unchanged apart from the version line.

- `inventory.mjs` (#40, #54): English help text such as "Page not found? See the sitemap." no longer marks a normal page as a soft 404. In the page text, "page not found" counts only when it isn't a question, as the Japanese footer case already did; the title and H1 rules are unchanged. Tests: `node --test scripts/inventory/test/`.
- `capture.mjs` (#44, #55): a second run into the same `--out` folder (for example English pages, then Japanese) adds its notes to `capture-notes.md` under its own `# Capture log <time>` heading instead of replacing the first run's. A first run writes the same file as before. Tests: `node --test scripts/capture/test/`.
- `check-report.mjs` (#52, #56): a bilingual report is read one language template at a time, as `check-deliverable` does, so each finding is counted once per language instead of once per copy (which failed every bilingual report with duplicate numbers). With `--old`, each language is compared with the same language; a language added or dropped between versions is noted, not failed, and a document without templates is compared with a single-template version of it. Templates and findings inside HTML comments are ignored. Reports with templates now print `[en]`, `[ja]` before their counts. Tests: `node --test scripts/checks/test/`.
- `check-mock.mjs` (#52, #56): `class="fixed none"`, which its own message advises for a page with no fixed elements, now passes. Tests: `node --test scripts/checks/test/`.

## 0.8.8

- `docs/other-agents.md`: how to use AIspy with other agents such as Codex. The README links to it.
- `AGENTS.md` "Running a review", for agents that read it (Codex does, automatically):
  - start each lens and checker with no conversation history;
  - give checkers only the render and the report, and don't reuse an agent for a second role;
  - stop and show the mock spec before building the mock;
  - read the reference examples in full.
- `CLAUDE.md` holds the two lines Claude Code had in 0.8.7 (no install needed; read `CONTRIBUTING.md` before changing the kit) instead of importing `AGENTS.md`, so the new lines above don't change a Claude run.
- `CONTRIBUTING.md` replaces `docs/maintaining.md`, keeping the rules any contributor needs: the checks to run, one issue per PR, and "Changes must not make reviews worse" (other-tools work is additive only; script fixes are compared before and after). The maintainer's own process is kept out of the repository, in git-ignored `*.local.md` files.
- `ROADMAP.md` removed. The README points to the open issues instead.
- Plugin metadata: `plugin.json` adds `author`, `homepage`, `repository` and `keywords`; the marketplace `owner` is the author. The `product-review` skill description says "the product" and "a request" instead of "client"; its trigger phrases are unchanged.
- Examples: the screenshots embedded in both localisation reviews are re-encoded as lossless WebP, so both files are well under the plugin directory's file-size limit (Brolga 5.5 → 2.3 MB, Mareo 5.0 → 2.7 MB). Every image and every rendered page is pixel-identical; nothing else changed. Compressing a run's own documents is #50.

## 0.8.7

- `capture.mjs` (#20, #35): exits with status 1 when any page fails, still writing `capture-notes.md`. Pages listed without a name are renamed: names now include the host, e.g. `example.com/products` → `example-com-products` (was `products`), and `_` is no longer kept, so two URLs with the same path no longer overwrite each other. Pages given a tab-separated name are unchanged. Duplicate names are refused before capturing, and query values are never put in file names. Tests: `node --test scripts/capture/test/`.
- `inventory.mjs` (#21, #36):
  - Redirects are followed, and the target is grouped under its own page type; the original URL stays in `broken.md` for cleanup.
  - Redirect loops, and chains over 10 hops, are reported.
  - A redirect to another site is listed as an off-site redirect and kept out of the page groups; `www.` and the bare domain count as the same site.
  - Soft 404s are detected from the title, the H1 and complete not-found phrasing in the page text, in English and Japanese, without flagging pages that only mention 404 in their text, or the common Japanese footer 「お探しのページが見つからない場合は…」.
  - `inventory.csv` gains `error` and `offsite` columns.
  - Tests: `node --test scripts/inventory/test/`.
- `AGENTS.md` and `CLAUDE.md` (#34, #37, #38): `CLAUDE.md` loads `AGENTS.md`, so Claude Code and Codex read the same instructions. `AGENTS.md` holds only what a review needs, starting from `skills/product-review/SKILL.md` with no install, and points anyone changing the kit to `docs/maintaining.md`.
- `docs/maintaining.md` (#38): the maintainer rules.
  - Branches and PRs; merge, tag or release only with the maintainer's approval and after a separate review.
  - The release steps, and no private material in commits.
  - "Changes must not make reviews worse": other-tools work is additive only, and issue fixes are compared before and after.

## 0.8.6

- README: tagline is now "A full UX, UI and IA review from your AI crew.", as on the product page.
- README: who it's for: product managers, founders, developers and marketers without a senior designer to hand, plus designers and agent-led teams.
- README: the intro says "a skill pack for Claude Code" (was "a set of Claude skills"), as on the product page. Other agents aren't tested yet (#13).
- README: the "supports a reviewer" line is reworded to match the new audience and the product page.
- README: links to stevensmith.dev carry `utm_source=github` and the repo name, so visits from the repo can be counted.

## 0.8.5

- README: a line under the screenshots saying who AIspy is for: designers and product managers who want a second pair of eyes before a senior review.

## 0.8.4

- README: a "Made by" line with a link to stevensmith.dev/aispy under the tagline.
- README: the three output screenshots (report, IA analysis, mock) move to the top, under the byline. Their caption keeps what "What you get" said: the images are Brolga's run output, and `examples/mareo/` is the standard a run is held to. The "What you get" heading is gone; its content is in the caption.

## 0.8.3

- README: a **Quick start** under the intro. Two routes, three steps each: get AIspy (clone or download, or the `/plugin` install), ask "Set up AIspy for my first review", then ask for the review. Each route was tested in a fresh session up to the end of the setup check. A downloaded ZIP unpacks to `aispy-main`, so the Quick start says to rename it to `aispy`.
- README Install: a plugin added from a local copy (`/plugin marketplace add ./aispy`) runs from that folder, so its capture install goes there, as for a clone. Only the GitHub install uses the plugin cache path.
- README: the Quick start and How to start sections also in Japanese, with Japanese sample requests.
- `docs/how-to-use.md` points to the Quick start, says to name the folder in the request when the pack isn't an installed plugin, and says the setup request runs the capture install.

## 0.8.2

- README install: the folder is `aispy` (lower case) throughout. The capture install has an explicit path and working directory for both routes: from a clone, and with `/plugin` (the newest installed version under `~/.claude/plugins/cache/aispy/aispy/`).
- README prerequisites: Python 3, for the design-system validator.
- Fonts: `examples/brolga/LICENSE.md` carries the Barlow Condensed copyright notice and the SIL Open Font License 1.1; the embedded font is under OFL, not CC BY. Mareo embeds no font files.
- Brolga example: the run-folder paths are removed from the documents' CSS comments.
- `product-review` setup check: when the person supplies only screens, the browser check is skipped and `01-frame.md` records that the sweep is done from the supplied screens.
- `inventory.mjs --measure` loads Playwright from `scripts/capture/`, so it works after the documented capture install; `docs/how-to-use.md` says so.
- Root `LICENSE` lists both examples under CC BY 4.0; ROADMAP drops the second example (done in 0.8.0); `check-mock.mjs` points to the mock rules in `references/deliverables.md`.

## 0.8.1

- `product-review` "Reference examples": `templates/` sets which sections a document has; `examples/mareo/` sets the standard for what each section contains, how it is argued and how evidence is marked. Names the files to open in each example. The findings count follows the 12–15 rule; Brolga is a run's output, not the standard.
- Mareo example: the localisation review and IA analysis are renamed without `-draft`, as Brolga's are, with every link updated. Each document carries `data-doc`, so `check-deliverable` works without `--type`.
- README: "What you get" names Mareo as the standard and shows Brolga as a run's output; the sample request uses neutral wording.

## 0.8.0

- New example: **Mareo** (`examples/mareo/`), the reference review recreated on a fictional Danish sofa brand selling in Japan: index, localisation review, IA analysis, mock and mock spec, plus the store's product page before and after. One product page; sections that need other pages are labelled "out of scope in this example". English and Japanese, CC BY 4.0 (`examples/mareo/LICENSE.md`).
- `product-review`: when the person supplies no examples, `examples/mareo/` is the default standard for document form, argument density, evidence marking and the mock, and `examples/brolga/` shows a full multi-page run. A run doesn't copy Mareo's scope or its out-of-scope labels.
- `check-deliverable` and `check-mock` accept the reference review's structure as well as the templates', each checked in full:
  - report: `overview`, `context`, `works` and `<h3>A1 · …</h3>` appendix subsections; a summary table by perspective that must list every finding with its priority; inline questions (`p.ask`); a page diagram may stand in for a screenshot.
  - IA analysis: `pages` (page maps, legend and heading hierarchy) and `journeys`; a task labelled out of scope needs no route.
  - mock: notes as a title, a paragraph and a source line, as well as Now / Proposed.
  - In the reference form, a High/Medium finding without a local example and a task without a local site example are reported as notes, not failures.
- `check-mock` checks each language template on its own and reads only its first notes list, so notes are no longer counted again from the other languages or the no-script copy. Citations ("Localisation review 4", 指摘, IA分析, 付録 …) and design-proposal labels (デザイン提案, デザイン上の判断) are recognised in Japanese.
- `check-deliverable` passes `--ia` through to `check-mock`, so prefixed markers defined in the IA analysis resolve.
- `check-deliverable --forbid` matches Japanese names (substring; katakana only outside a longer katakana word). The matcher is in `scripts/checks/forbid.mjs`.
- Tests for the checks: `node --test scripts/checks/test/` (no dependencies).
- README: an Examples section; install commands use the repository name `aispy`.

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
