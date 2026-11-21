#!/usr/bin/env node
// Structural checks for a findings mock (see the "Mock" section of skills/product-review/references/deliverables.md).
// Usage: node check-mock.mjs --mock mock.html [--diff diff.md] [--report report.html] [--ia ia.html]
// With --diff: every row of diff.md that moves, removes or hides something must name the entry
// point that keeps it findable on the first screen ("Entry point" column, or "entry point:" text).
// Checks: every marker on the proposed side has a note and vice versa; marker numbers exist as
// findings in the report; D markers are labelled as design judgement; placeholders listed;
// logo provenance declared; the current side carries a fixed-element layer; no {{template}} left.
// Expects the template's structure: #proposed .mk, .notes li > .k, .current .fixed, [data-asset].
// Each language template (<template id="t-xx">) is checked on its own, reading only its first
// notes list; the <noscript> copy is ignored. A note is either Now / Proposed (p.now + p.then,
// the templates' form) or a title, a paragraph and a source line (b + p + span.f, the reference
// review's form). Citations and design-proposal labels are accepted in English or Japanese.
import fs from 'node:fs';

const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1]]);
  return acc;
}, []));
if (!a.mock) { console.error('Usage: node check-mock.mjs --mock mock.html [--report report.html] [--ia ia.html]'); process.exit(2); }

const full = fs.readFileSync(a.mock, 'utf8').replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<noscript[\s\S]*?<\/noscript>/g, '');
const tpls = [...full.matchAll(/<template id="t-(\w+)"[^>]*>([\s\S]*?)<\/template>/g)].map((m) => ({ lang: m[1], html: m[2] }));
const blocks = tpls.length ? tpls : [{ lang: null, html: full }];

const CITE = /finding|IA analysis|App\.|appendix|\breview\s+\d|指摘|所見|レビュー\s*\d|IA分析|情報設計|付録/i;
const DESIGN = /design judgement|design proposal|デザイン上の判断|デザイン判断|デザイン提案/i;
const clean = (t) => t.replace(/<[^>]+>/g, '').trim();
const uniq = (xs) => [...new Set(xs)];
let fail = 0;
const bad = (msg) => { console.log(`  ✗ ${msg}`); fail++; };
const ok = (msg) => console.log(`  ✓ ${msg}`);

// The first notes list: from class="notes" to the close of its first <ol>/<ul>.
const notesList = (html) => {
  const s = html.search(/class="notes"/); if (s < 0) return '';
  const rest = html.slice(s);
  const open = rest.search(/<(ol|ul)[\s>]/); if (open < 0) return '';
  const tag = rest.slice(open + 1, open + 3);
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g'); re.lastIndex = open;
  let depth = 0; let m;
  while ((m = re.exec(rest))) { depth += m[0].startsWith('</') ? -1 : 1; if (!depth) return rest.slice(open, m.index + m[0].length); }
  return rest.slice(open);
};

const rep = a.report ? fs.readFileSync(a.report, 'utf8').replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/gi, '') : null;

for (const { lang, html } of blocks) {
  if (lang && blocks.length > 1) console.log(`[${lang}]`);
  const section = (startRe, endRe) => {
    const s = html.search(startRe); if (s < 0) return '';
    const rest = html.slice(s); const e = rest.slice(1).search(endRe);
    return e < 0 ? rest : rest.slice(0, e + 1);
  };
  const proposed = section(/id="proposed"|id="device"/, /class="notes"/);
  const current = section(/class="current"/, /id="proposed"|id="device"/);
  const notesHtml = notesList(html);

  const markers = [...proposed.matchAll(/class="mk[^"]*"[^>]*>([^<]+)</g)].map((m) => clean(m[1]));
  const notes = [...notesHtml.matchAll(/<li[^>]*>\s*<span class="k[^"]*"[^>]*>([^<]+)<\/span>([\s\S]*?)<\/li>/g)].map((m) => ({ k: clean(m[1]), body: m[2] }));

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
    if (!DESIGN.test(clean(n.body))) bad(`${n.k} is a design proposal but its note doesn't say so`);
  }
  const nowThen = (b) => /class="now"/.test(b) && /class="then"/.test(b);
  const titleBodySource = (b) => /<b>[\s\S]+?<\/b>/.test(b) && /<p[\s>]/.test(b) && /<span class="f"[^>]*>[^<]+</.test(b);
  const noForm = notes.filter((n) => !/^D\d+/.test(n.k) && !nowThen(n.body) && !titleBodySource(n.body)).map((n) => n.k);
  if (noForm.length) bad(`notes without a Now / Proposed pair (or a title, a paragraph and a source line): ${noForm.join(', ')}`);
  for (const n of notes.filter((n) => !/^D\d+/.test(n.k))) {
    if (!CITE.test(clean(n.body))) bad(`note ${n.k} doesn't cite the finding it implements`);
  }

  if (rep) {
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

  /class="(?:[^"]*\s)?fixed(?:\s[^"]*)?"/.test(current) ? ok('current side has a fixed-element layer') : bad('current side has no fixed-element layer: use set B and overlay fixed elements, or state that the page has none (class="fixed none")');

  const unfilled = html.match(/\{\{[^}]{1,80}\}\}/g) || [];
  if (unfilled.length) bad(`${unfilled.length} unfilled template fields, e.g. ${unfilled.slice(0, 3).join(' ')}`);
}

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

console.log(fail ? `FAIL: ${fail} problem(s). Also confirm diff.md lists every change.` : 'PASS. Structural checks only: the human review still decides whether every change is right.');
process.exit(fail ? 1 : 0);
