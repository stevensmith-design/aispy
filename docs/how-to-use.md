# How to use

What to give the pack for each kind of product, what to say in the request, and what to expect.

To get started, follow the [Quick start](../README.md#quick-start) in the README: get AIspy (a
clone or download, or the `/plugin` install), ask Claude "Set up AIspy for my first review", then
ask for the review. When the pack is a folder rather than an installed plugin, name it in the
request ("Use the AIspy kit in ./aispy to review …").

## What to provide, by product type

### Live website
The URL is enough. Better: also save each page in scope as HTML (in the browser, **Save page
as… → Webpage, Complete**) into one folder and connect that folder to the session. Extraction then
works from the real markup and CSS, even when the site blocks scripted browsers.

### Staging or local site
Give the **served build** (the built HTML, CSS and JS) or a URL the session can reach. Never give
the source project: the source holds the design intent, and reading it biases the review towards
what was meant rather than what a visitor actually gets.

### Logged-in areas
Sign in yourself in the browser the session uses. The pack never asks for, types or stores
credentials, and it doesn't add to cart, enter personal or payment data, or publish anything.

### Native app
Either a simulator or emulator the session can see and operate (Xcode Simulator, an Android
emulator through computer use), or exported screens for each flow, in which case the sweep (opening
every menu, sheet and option) is done by hand. Tap areas are measured less exactly than on the
web; the report says so.

## What to say in the request

Include:

- **Review type:** a general review, or a general review plus market localisation (name the market).
- **Priority device:** phone first, desktop first, or both.
- **Scope:** the pages or flows to cover. For a large site, ask for `review-scoping` first; it
  inventories the site and proposes pages by type.
- **Language** of the deliverables.
- **"Start separate agents for the lenses and checks."** The three review lenses and every
  independent check run as separate agents so they don't influence each other. Many sessions only
  start agents when asked; without this line, the pack asks you once at the start.

Example:

```
Review https://example.com and propose improvements. They're launching in Japan, so include a
localisation review. Phone first; top page, listing, two product pages and the size guide.
Deliverables in English. Start separate agents for the lenses and checks.
```

The pack takes a quick look, then asks one batch of questions with a proposed default for each,
so "go" is a valid answer.

## What to expect

Before the review starts, a **setup check** confirms that agents start, a browser reaches the site,
screenshots work and the kit's skills are readable. If any of these fails, it stops and tells you
rather than continuing in a weaker mode.

Then three stops, each with one review round from you:

| Stop | What you get | Rough time |
|---|---|---|
| 1. Review | The review report and the IA analysis | Capture, research and the three lenses depend on scope; the deliverables step takes about 40 minutes from a finished review |
| 2. Mock | A mock spec (one row per change) for your approval, then the current-vs-proposed mock | About 25 minutes, including the spec and checks |
| 3. Packaging | The index page and the final package | Short |

Times are from the test runs and vary with scope and the session. Everything is written to
`review/<product>-<date>/` in the folder you connected, with a `run-log.md` of what ran, when and
with which agents.

## Accessibility: what is and isn't checked

**Checked:** text contrast, text size, tap-target size and spacing, image alt text, screen-reader
strings (labels and names on controls), the heading outline, and motion.

**Not checked:** this is not a full WCAG audit. There is no screen-reader or keyboard-only walk
through the product unless you ask for one.

## Running the scripts

The skills say when to use each script. Paths are relative to the pack root. The capture helper
is needed for the evidence crops (`annotate.mjs`) and the setup check's screenshot test, so install
it before the first review. The rest need only Node, except `inventory.mjs --measure`, which uses
the capture helper's Playwright.

| Folder | Needs | Install |
|---|---|---|
| `scripts/build/`, `scripts/checks/` | Node 22.23.5+ only | none |
| `scripts/inventory/` | Node 22.23.5+; `--measure` also needs Playwright | none; for `--measure`, the `scripts/capture/` install |
| `scripts/capture/` | Node 22.23.5+ and Playwright | `cd scripts/capture && npm install && npx playwright install chromium` |

Asking Claude "Set up AIspy for my first review" runs the capture install for you. To run it by
hand, see [Install](../README.md#install) in the README for the folder to run it in for each route.
