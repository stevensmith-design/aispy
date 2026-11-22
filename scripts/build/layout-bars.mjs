#!/usr/bin/env node
// Page layout by type: bars, role shares and section lists for the IA analysis, from measured
// section positions. Writing percentages by hand drifts; generate them.
// Usage: node layout-bars.mjs layout.json > layout-snippets.html
//
// layout.json:
// { "screenPx": 844,                          // one screen on the priority device
//   "pages": [ { "id": "pdp", "title": "Product page",
//     "rows": [                               // client first, then benchmark(s), then proposed
//       { "label": "Client JP", "kind": "client",
//         "sections": [ { "name": "Gallery", "role": "persuade", "top": 0, "bottom": 840 }, ... ] },
//       { "label": "Benchmark", "kind": "benchmark", "sections": [ ... ] },
//       { "label": "Proposed", "kind": "proposed", "sections": [ ... ] } ] } ] }
// top/bottom in CSS px from the top of the page (from the capture's section sweep), or
// "from"/"to" in screens. Roles: decide, reassure, persuade, sell, navigate.
// Output per page: a .layoutcard with .pmap bars on one shared scale (colour only: each
// segment's name and screens are in data-tip, which base.css shows as a tooltip on hover; never
// text in the bar; .e marks segments in the right half, whose tooltip opens leftwards), a .shares
// table, an empty p.reads to write (with the numbers it should use in a comment), and the
// client's section list. Stdout also ends with a plain-text summary per page for the run log.
import fs from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node layout-bars.mjs layout.json'); process.exit(2); }
const L = JSON.parse(fs.readFileSync(file, 'utf8'));
const SCR = L.screenPx || 844;
const ROLES = ['decide', 'reassure', 'persuade', 'sell', 'navigate'];
const NAMES = { decide: 'Decide', reassure: 'Reassure', persuade: 'Persuade', sell: 'Sell more', navigate: 'Navigate' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
const pct = (n) => `${(Math.round(n * 100) / 100).toFixed(2)}%`;
let problems = 0;

function norm(row) {
  const secs = row.sections.map((s) => {
    const from = s.from ?? s.top / SCR; const to = s.to ?? s.bottom / SCR;
    if (!ROLES.includes(s.role)) { console.error(`  ✗ ${row.label} · ${s.name}: unknown role "${s.role}"`); problems++; }
    if (!(to > from)) { console.error(`  ✗ ${row.label} · ${s.name}: end is not after start`); problems++; }
    return { ...s, from, to };
  }).sort((a, b) => a.from - b.from);
  // Sections must not overlap (a nested element listed beside its parent): the bars would draw
  // on top of each other and the shares could sum past 100%. 0.05 screens allows for rounding.
  // Compare with the section that reaches furthest so far, so a parent is checked against every
  // child, not only the first.
  let reach = secs[0];
  for (const s of secs.slice(1)) {
    if (s.from < reach.to - 0.05) { console.error(`  ✗ ${row.label} · ${s.name}: overlaps ${reach.name} (screens ${r1(s.from + 1)}–${r1(Math.min(s.to, reach.to) + 1)}); list only one of them`); problems++; }
    if (s.to > reach.to) reach = s;
  }
  const end = Math.max(...secs.map((s) => s.to));
  const share = Object.fromEntries(ROLES.map((r) => [r, secs.filter((s) => s.role === r).reduce((t, s) => t + (s.to - s.from), 0) / end]));
  const first = Object.fromEntries(ROLES.map((r) => [r, (secs.find((s) => s.role === r) || {}).from]));
  return { ...row, secs, end, share, first };
}

const out = []; const summary = [];
for (const page of L.pages) {
  const rows = page.rows.map(norm);
  const max = Math.max(...rows.map((r) => r.end));
  const client = rows.find((r) => r.kind === 'client') || rows[0];
  const bench = rows.filter((r) => r.kind === 'benchmark');
  const prop = rows.find((r) => r.kind === 'proposed');
  const h = [];
  h.push(`<div class="layoutcard" id="layout-${esc(page.id)}">`, `<h3>${esc(page.title)}</h3>`, '<div class="pmap">');
  for (const r of rows) {
    h.push(`<div class="r${r.kind === 'proposed' ? ' prop' : ''}"><b>${esc(r.label)}<small>${r1(r.end)} screens · ${r.secs.length} sections</small></b><div class="bar">`);
    for (const s of r.secs) {
      const w = ((s.to - s.from) / max) * 100;
      h.push(`<div class="s r-${s.role}${s.from / max > 0.5 ? ' e' : ''}" style="left:${pct((s.from / max) * 100)};width:${pct(w)}" data-tip="${esc(s.name)} (screens ${r1(s.from + 1)}–${r1(s.to + 1)})"></div>`);
    }
    h.push('</div></div>');
  }
  const ticks = [1, Math.round(max / 2) + 1, Math.round(max) + 1];
  h.push(`<div class="axis"><span></span><div>${ticks.map((t) => `<span>screen ${t}</span>`).join('')}</div></div>`, '</div>');
  // Shares: a client cell is .bad when its share of decide/reassure is under 70% of the
  // benchmark average; a proposed cell is .ok when it closes at least half of that gap.
  const avg = (r) => (bench.length ? bench.reduce((t, b) => t + b.share[r], 0) / bench.length : null);
  h.push(`<div class="scroll"><table class="shares"><tr><th>Share of page</th>${ROLES.map((r) => `<th>${NAMES[r]}</th>`).join('')}<th>Decide starts</th><th>Reassure starts</th></tr>`);
  for (const r of rows) {
    const cells = ROLES.map((role) => {
      const v = r.share[role]; const b = avg(role); let c = '';
      if (b !== null && ['decide', 'reassure'].includes(role)) {
        if (r === client && v < 0.7 * b) c = ' class="bad"';
        if (r === prop && client.share[role] < 0.7 * b && v - client.share[role] >= (b - client.share[role]) / 2) c = ' class="ok"';
      }
      return `<td${c}>${Math.round(v * 100)}%</td>`;
    }).join('');
    const at = (v) => (v === undefined ? '—' : `screen ${r1(v + 1)}`);
    h.push(`<tr><td>${esc(r.label)}</td>${cells}<td>${at(r.first.decide)}</td><td>${at(r.first.reassure)}</td></tr>`);
  }
  h.push('</table></div>');
  const facts = rows.map((r) => `${r.label}: decide ${Math.round(r.share.decide * 100)}% from screen ${r.first.decide === undefined ? '—' : r1(r.first.decide + 1)}, reassure ${Math.round(r.share.reassure * 100)}% from screen ${r.first.reassure === undefined ? '—' : r1(r.first.reassure + 1)}, ${r1(r.end)} screens`).join('; ');
  h.push(`<!-- WRITE p.reads: what the bars show → finding (report #n, IA-n) → what the proposal changes. Numbers: ${esc(facts)} -->`);
  h.push('<p class="reads"><b>What it shows:</b> {{reads}}</p>');
  h.push('<div class="lrow lhead"><span>Section</span><span>Role</span><span class="track"></span><span>Screen</span></div>');
  for (const s of client.secs) {
    h.push(`<div class="lrow"><span>${esc(s.name)}</span><span class="lrole"><i class="r-${s.role}"></i>${NAMES[s.role] || s.role}</span><span class="track"><b class="r-${s.role}" style="left:${pct((s.from / client.end) * 100)};width:${pct(((s.to - s.from) / client.end) * 100)}"></b></span><span class="lscr">${r1(s.from + 1)}</span></div>`);
  }
  h.push('</div>');
  out.push(h.join('\n'));
  summary.push(`${page.title}: ${facts}`);
}
console.log(out.join('\n\n'));
console.log(`\n<!-- SUMMARY\n${summary.join('\n')}\n-->`);
process.exit(problems ? 1 : 0);
