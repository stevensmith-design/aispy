# Codex CLI comparison on the Brolga example

Run on 20–21 November 2026 with Codex CLI 0.171.0 and AIspy 0.8.7.

## Result

Codex successfully discovered all eight AIspy skills from a fresh clone, started independent
agents, rendered the Brolga report, IA analysis and mock at 390 and 1440 px, and audited the
completed package. The three lenses supported the Claude run's central findings and did not find
evidence that its overall review quality was lower. Codex also found specific accessibility,
arithmetic and cross-document consistency defects that the existing structural checks do not
catch.

This was an **artifact replay, not an end-to-end product review**. `examples/brolga/` contains the
completed report, IA analysis, mock and mock spec, but not the original shop build, captures,
design-system extraction, research file, lens outputs or run log. Capture, live paths, research,
synthesis, document generation and elapsed cost therefore could not be reproduced. This test does
not establish end-to-end quality or cost parity with Claude Code.

## Setup and independence

- A fresh local clone exposed `product-review`, `review-scoping` and all six design-kit skills to
  Codex without configuration or copied files.
- A Codex CLI smoke run started a context-free subagent successfully. Its first inherited-context
  attempt failed with a missing-rollout error, then succeeded on retry. Five separate agents in
  the comparison session completed without seeing one another's work: three lenses, a facts and
  claims check, and a design and structure check.
- The supplied HTML rendered through a local server and scripted browser at 390 × 844 and
  1440 × 900. The kit and its checks were readable and runnable.
- Windows was not tested.

## Stage comparison

| Stage | Claude Brolga run | Codex replay | Difference |
|---|---|---|---|
| Capture and sweep | Six pages, live states and both widths | Not rerun | Original build and capture folder are not supplied |
| Design system | Extracted from the shop | Not rerun | Tokens are embedded in the finished documents only |
| Research and benchmarks | Live market research and measured comparisons | Evidence and caveats audited | Freshness and blocked sources could not be rechecked |
| Three lenses | Independent UI, IA and whole-product review | Three separate Codex agents audited the artifacts | Codex assessed support and omissions, not a clean discovery run |
| Findings | 18 findings plus lower-priority items | Core argument supported; severity and scope concerns found | Findings 5, 11 and 14 still require the original site for full verification |
| Report and IA | Finished draft documents | Rendered and reviewed at both widths | Strong structure; accessibility defects found in the document shell |
| Mock | 15 approved changes | Spec, report and mock cross-checked | Strong traceability; five internal inconsistencies found |
| Independent checks | Structural, facts and design checks in the Claude run | Fresh facts and design agents plus repository checks | Codex found issues the structural checker accepts |

## Findings comparison

The artifact evidence supports the main story: the phone layout breaks, width intent and filter
state are lost, width and fit help arrive too late, membership and service routes dead-end, stock
and comparison logic mislead, and local trust information is too far from the decision.

The strongest evidence-to-action chains were findings 1, 2, 5, 6, 7, 11, 12, 13, 16 and 18.
Findings 5, 11 and 14 are only partly replayable because URL history, the full site sweep and live
search/contact behavior are absent. Finding 9 appears over-weighted at Medium. Finding 10 is best
framed as surfacing the fee and explicitly answering payment questions, not treating every absent
payment method as a defect. Finding 14's Brolga-side dead ends are supported, while its broader
market-convention claim remains explicitly unmeasured.

The IA agent would promote the contradictory sizing rules and the women-selling/men-only
conversion table from candidates for further assessment. It would drop the wording preference
around `カートに追加` as an IA finding and split the bundled lower-priority IA row into separate
causes and owners.

## Document and mock comparison

What held up well:

- The report has strong hierarchy, dense but traceable evidence, explicit trade-offs, metrics and
  benchmark-transfer reasoning.
- The IA analysis is the clearest document: eight user-worded task paths, measured page roles,
  label evidence and proposed structure remain linked to report findings.
- The mock is specific to Brolga, preserves its typography, photography, icons and restrained
  palette, and maps all 15 visible changes to report findings.
- No page-level horizontal overflow or confirmed generic/AI-made styling appeared at either width.

Differences and defects Codex found:

1. The mock says there are 198 reviews, but its distribution is 135 + 44 + 12 + 6 + 2 = 199 and
   its percentages total 100.5%.
2. Finding 9 proposes name + price, then width + size in the report; the approved spec and mock use
   name + width + size, then price, without recording why the proposal changed.
3. The report's proposed mock scope lists eight findings, while the delivered mock covers 15.
4. The mock promises no decision-path text below 13 px but renders several spec and comparison
   labels at 12 px.
5. Markers 7 and 8 cover only part of their report findings, but the mock's “not shown” disclosure
   does not name the omitted halves.
6. Report and IA evidence lightboxes are pointer-only and remain hidden from assistive technology;
   they lack button and dialog semantics, focus handling and keyboard close behavior.
7. Four genuinely overflowing table regions in each document are not focusable or named for
   keyboard users.
8. The mock's two phone frames are unnamed, non-focusable scroll containers with hidden
   scrollbars; its marker toggle exposes no state.
9. One 12 px breadcrumb separator in the mock renders at 1.6:1 contrast.
10. The mobile document table of contents hides later sections without a continuation cue.

The example files were not changed: issue #13 requires `examples/` to remain identical to v0.8.7.
These findings are comparison evidence, not fixes included in this change.

## Checks, time and cost

- `node --test scripts/checks/test/`: 29 passed, 0 failed.
- `check-deliverable.mjs`: all four Mareo and all four Brolga HTML files passed; the existing notes
  remained notes.
- `git diff --stat v0.8.7 -- skills/ scripts/ examples/`: empty.
- The fresh-clone discovery/subagent smoke run took 19.9 seconds and reported 8,607 tokens.
- The recorded browser-and-agent artifact replay ran from 23:59 to shortly after 00:15, about 20
  minutes. The host did not expose per-agent token or monetary cost, so a reliable audit cost
  cannot be reported.

The timing is not comparable with the Claude baseline: it omits capture, extraction, research,
fresh finding discovery and document production. A future end-to-end comparison needs the
original Brolga shop build and run inputs, or another equivalent test product available to both
hosts.

## Support conclusion

Codex CLI is tested for repository skill discovery, independent agents, the AIspy scripts and a
Brolga artifact audit. A complete AIspy review in Codex remains untested. Claude Code remains the
only supported and fully tested host; the portfolio website should not broaden that claim yet.
