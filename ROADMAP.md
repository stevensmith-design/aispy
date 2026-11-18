# Roadmap

Open items, logged but not yet done. Each is also a GitHub issue.

## Templates
- **Page-layout bars: readable labels.** Section names get squashed in narrow segments. Options:
  label only segments wide enough and key the rest to a legend under the bar; taller bars with
  two-line labels; or a tooltip plus the section list that already follows each card.
- **A "what this shows" line under each IA section.** One short line explaining each analysis
  section (page layout by type, heading hierarchy, task paths, label audit, proposed structure)
  for a reader new to it, fixed in the template.

## Possible addition
- **Decision guide.** A way to read each proposal with its justification and the design:
  proposal → finding → evidence → why it will work → mock marker → metric. Could be a third
  document, a section of the index, or an extended mock notes column.

## Accessibility
- **axe-core in capture.** Run axe-core on every captured page and give its results to the UI
  lens, so accessibility starts from a systematic WCAG pass. Still not a full audit.

## Polish
- **Writing length** against the reference review (one sentence per grouped point, short
  proposals): in the pack since 0.6.5, not yet confirmed in a run.
- **Role colours for very dark or monochrome brands.**
- **Brand fonts not embedded** in the documents when the brand's font files aren't available.
