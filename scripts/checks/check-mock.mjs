#!/usr/bin/env node
// Structural checks for a findings mock (see skills/findings-mock/SKILL.md).
// Usage: node check-mock.mjs --mock mock.html [--diff diff.md] [--report report.html] [--ia ia.html]
// With --diff: every row of diff.md that moves, removes or hides something must name the entry
// point that keeps it findable on the first screen ("Entry point" column, or "entry point:" text).
// Checks: every marker on the proposed side has a note and vice versa; marker numbers exist as
// findings in the report; D markers are labelled as design judgement; placeholders listed;
// logo provenance declared; the current side carries a fixed-element layer; no {{template}} left.
// Expects the template's structure: #proposed .mk, .notes li > .k, .current .fixed, [data-asset].
import fs from 'node:fs';

const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1]]);
  return acc;
}, []));
if (!a.mock) { console.error('Usage: node check-mock.mjs --mock mock.html [--report report.html] [--ia ia.html]'); process.exit(2); }

const html = fs.readFileSync(a.mock, 'utf8').replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/gi, '').replace(/<!--[\s\S]*?-->/g, '');
const section = (startRe, endRe) => {
  const s = html.search(startRe); if (s < 0) return '';
  const rest = html.slice(s); const e = rest.slice(1).search(endRe);
  return e < 0 ? rest : rest.slice(0, e + 1);
};
const proposed = section(/id="proposed"|id="device"/, /class="notes"/);
const current = section(/class="current"/, /id="proposed"|id="device"/);
const notesHtml = section(/class="notes"/, /<\/aside>|<footer|<\/main>/);
const clean = (t) => t.replace(/<[^>]+>/g, '').trim();

const markers = [...proposed.matchAll(/class="mk[^"]*"[^>]*>([^<]+)</g)].map((m) => clean(m[1]));
const notes = [...notesHtml.matchAll(/<li[^>]*>\s*<span class="k[^"]*"[^>]*>([^<]+)<\/span>([\s\S]*?)<\/li>/g)].map((m) => ({ k: clean(m[1]), body: m[2] }));
const uniq = (xs) => [...new Set(xs)];
let fail = 0;
const bad = (msg) => { console.log(`  ✗ ${msg}`); fail++; };
const ok = (msg) => console.log(`  ✓ ${msg}`);

console.log(`Markers on proposed side: ${uniq(markers).join(', ') || 'none'}`);
console.log(`Notes: ${notes.map((n) => n.k).join(', ') || 'none'}`);
if (notes.length > 18) bad(`${notes.length} notes: keep the mock to about 10–15 changes, one marker per change, and list the rest as not shown`);
const subs = uniq(markers).filter((k) => /^\d+[a-z]$/.test(k));
if (subs.length) bad(`sub-markers (${subs.slice(0, 6).join(', ')}): use the finding's own number; a change that answers two findings names both in its note`);
const noteKeys = new Set(notes.map((n) => n.k));
const markerKeys = new Set(markers);
const noNote = uniq(markers).filter((k) => !noteKeys.has(k));
const curKeys = new Set([...current.matchAll(/class="mk[^"]*"[^>]*>([^<]+)</g)].map((m) => clean(m[1])));
const noMarker = [...noteKeys].filter((k) => !markerKeys.has(k) && !curKeys.has(k)); // a removal is marked on the current side only
noNote.length ? bad(`markers without a note: ${noNote.join(', ')}`) : ok('every marker has a note');
noMarker.length ? bad(`notes without a marker (points at nothing visible): ${noMarker.join(', ')}`) : ok('every note has a marker');
const currentMarks = [...current.matchAll(/class="mk[^"]*"[^>]*>([^<]+)</g)].map((m) => clean(m[1]));
if (!currentMarks.length) bad('no markers on the current side: mark each problem as it is now with the same number');
else {
  const stray = uniq(currentMarks).filter((k) => !noteKeys.has(k));
  stray.length ? bad(`current-side markers without a note: ${stray.join(', ')}`) : ok(`current side marked (${uniq(currentMarks).length} of ${noteKeys.size} notes; D proposals and pure additions may have none)`);
}

for (const n of notes.filter((n) => /^D\d+/.test(n.k))) {
  if (!/design judgement|design proposal/i.test(n.body)) bad(`${n.k} is a design proposal but its note doesn't say so`);
}
const noBefore = notes.filter((n) => !/^D\d+/.test(n.k) && !(/class="now"/.test(n.body) && /class="then"/.test(n.body))).map((n) => n.k);
if (noBefore.length) bad(`notes without a Now / Proposed pair: ${noBefore.join(', ')}`);
for (const n of notes.filter((n) => !/^D\d+/.test(n.k))) {
  if (!/finding|IA analysis|App\.|appendix/i.test(n.body)) bad(`note ${n.k} doesn't cite the finding it implements`);
}

if (a.report) {
  const rep = fs.readFileSync(a.report, 'utf8').replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/gi, '');
  const nums = new Set([
    ...[...rep.matchAll(/class="[^"]*\bf-no\b[^"]*"[^>]*>\s*([^<\s]+)\s*</g)].map((m) => m[1]),
    ...[...rep.matchAll(/<article[^>]*\bid="f(\d+)"/g)].map((m) => m[1]),
    ...[...rep.matchAll(/<tr[^>]*\bid="f(\d+)"/g)].map((m) => m[1]), // further-findings rows
  ]);
  const ia = a.ia ? fs.readFileSync(a.ia, 'utf8') : rep;
  const missing = uniq(markers).filter((k) => /^\d+$/.test(k) && !nums.has(k));
  missing.length ? bad(`markers with no matching finding in the report: ${missing.join(', ')}`) : ok(`numeric markers all exist in the report (${nums.size} findings)`);
  const prefixed = uniq(markers).filter((k) => /^[A-CE-Z]\d+$/.test(k) && !new RegExp(`\\b${k}\\b`).test(ia));
  if (prefixed.length) bad(`prefixed markers not found in the IA analysis or report: ${prefixed.join(', ')}`);
}

const tbd = (html.match(/class="[^"]*\btbd\b/g) || []).length;
console.log(`  · ${tbd} placeholder(s) for client data`);
if (tbd && !/class="legend"[\s\S]{0,2000}tbd/.test(html)) bad('placeholders used but the legend does not explain them');

const assets = [...html.matchAll(/data-asset="([^"]+)"/g)].map((m) => m[1]);
if (!assets.length) bad('logo provenance not declared (data-asset="official", "site" or "stand-in")');
else if (assets.includes('stand-in') && !/stand-in/i.test(clean(html.slice(html.search(/class="legend"/))))) bad('stand-in logo used but not noted in the legend');
else ok(`logo provenance: ${uniq(assets).join(', ')}`);

/class="fixed"/.test(current) ? ok('current side has a fixed-element layer') : bad('current side has no fixed-element layer: use set B and overlay fixed elements, or state that the page has none (class="fixed none")');

if (a.diff) {
  const rows = fs.readFileSync(a.diff, 'utf8').split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l));
  const head = (rows[0] || '').split('|').map((c) => c.trim().toLowerCase());
  const entryCol = head.findIndex((c) => c.includes('entry point'));
  const moved = rows.slice(1).filter((r) => /\b(mov|remov|hid|hidden|no longer|not shown|削除|移動)/i.test(r));
  const missing = moved.filter((r) => {
    const cells = r.split('|').map((c) => c.trim());
    const entry = entryCol >= 0 ? cells[entryCol] : '';
    return !(entry && !/^[-–—]?$|^n\/?a$/i.test(entry)) && !/entry point:/i.test(r);
  });
  if (entryCol < 0 && moved.length) bad('diff.md has no "Entry point" column for moved or removed elements');
  else if (missing.length) bad(`moved/removed elements without a first-screen entry point: ${missing.length} (e.g. ${missing[0].slice(0, 90)}…)`);
  else ok(`moved/removed elements: ${moved.length}, each with an entry point`);
}

const unfilled = html.match(/\{\{[^}]{1,80}\}\}/g) || [];
if (unfilled.length) bad(`${unfilled.length} unfilled template fields, e.g. ${unfilled.slice(0, 3).join(' ')}`);

console.log(fail ? `FAIL: ${fail} problem(s). Also confirm diff.md lists every change.` : 'PASS. Structural checks only: the human review still decides whether every change is right.');
process.exit(fail ? 1 : 0);
