#!/usr/bin/env node
// Compare two versions of a review report and list what changed in the findings.
// Usage: node check-report.mjs --old v1.html --new v2.html [--changelog 08-changelog.md]
// Also checks the new version on its own: duplicate numbers, unfilled {{template}} fields,
// and counts visible placeholders (class="tbd").
// Exit 1 if a finding disappeared or was renumbered without its title appearing in the changelog.
// No dependencies: reads <article class="finding" id="fN" data-key="..."> blocks and their <h3>.
// data-key is a stable slug that survives rewording and renumbering (e.g. "trust-at-cta"); when
// both versions have it, matching uses it. Otherwise titles are matched on shared words, and an
// unmatched finding gets its closest candidate as a hint.
import fs from 'node:fs';

const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1]]);
  return acc;
}, []));
if (!a.new) { console.error('Usage: node check-report.mjs [--old v1.html] --new v2.html [--changelog file.md]'); process.exit(2); }

const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function findings(file) {
  const html = fs.readFileSync(file, 'utf8').replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/gi, '');
  const out = [];
  const re = /<article[^>]*class="[^"]*\bfinding\b[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const idm = m[0].match(/\bid="([^"]+)"/);
    const no = (m[1].match(/class="[^"]*\bf-no\b[^"]*"[^>]*>([^<]+)</) || [])[1] || ((idm && idm[1].match(/^f(\d+)$/)) || [])[1];
    const h3 = (m[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '';
    const key = (m[0].match(/\bdata-key="([^"]+)"/) || [])[1] || null;
    out.push({ id: idm ? idm[1] : null, key, no: no ? no.trim() : null, title: strip(h3) });
  }
  return { html, out };
}
// Titles often get reworded between versions; match on shared words, not exact text.
function overlap(x, y) {
  const A = new Set(norm(x).split(' ').filter((w) => w.length > 2));
  const B = new Set(norm(y).split(' ').filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let k = 0; for (const w of A) if (B.has(w)) k++;
  return k / Math.min(A.size, B.size);
}
const same = (f, g) => (f.key && g.key ? f.key === g.key : similar(f.title, g.title));
function similar(x, y) {
  const A = new Set(norm(x).split(' ').filter((w) => w.length > 2));
  const B = new Set(norm(y).split(' ').filter((w) => w.length > 2));
  if (!A.size || !B.size) return norm(x) === norm(y);
  let k = 0; for (const w of A) if (B.has(w)) k++;
  return k / Math.min(A.size, B.size) >= 0.6;
}

let problems = 0;
const N = findings(a.new);
console.log(`New version: ${N.out.length} findings`);
const nums = N.out.map((f) => f.no).filter(Boolean);
const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
if (dup.length) { console.log(`  ✗ duplicate finding numbers: ${[...new Set(dup)].join(', ')}`); problems++; }
const unfilled = (N.html.match(/\{\{[^}]{1,80}\}\}/g) || []);
if (unfilled.length) { console.log(`  ✗ ${unfilled.length} unfilled template fields, e.g. ${unfilled.slice(0, 3).join(' ')}`); problems++; }
console.log(`  placeholders (tbd): ${(N.html.match(/class="[^"]*\btbd\b/g) || []).length}`);

if (a.old) {
  const O = findings(a.old);
  const log = a.changelog && fs.existsSync(a.changelog) ? norm(fs.readFileSync(a.changelog, 'utf8')) : '';
  console.log(`Old version: ${O.out.length} findings`);
  for (const f of O.out) {
    const match = N.out.find((g) => same(f, g));
    const explained = log && (log.includes(norm(f.title).slice(0, 40)) || (f.no && new RegExp(`\\b(finding|#|no\\.?)\\s*${f.no}\\b`).test(log)));
    if (!match) {
      const best = N.out.map((g) => [overlap(f.title, g.title), g]).sort((x, y) => y[0] - x[0])[0];
      const hint = best && best[0] >= 0.2 ? `\n      probably reworded as #${best[1].no} "${best[1].title}"? Give both the same data-key, or note it in the changelog` : '';
      console.log(`  ${explained ? '·' : '✗'} gone: #${f.no ?? '?'} ${f.title}${explained ? ' (reason in changelog)' : ' (NO REASON GIVEN)'}${explained ? '' : hint}`);
      if (!explained) problems++;
    } else if (match.no !== f.no) {
      console.log(`  · renumbered: #${f.no} → #${match.no} ${f.title} (update any mock markers)`);
    }
  }
  for (const g of N.out) if (!O.out.find((f) => same(f, g))) console.log(`  + new: #${g.no} ${g.title}`);
}
console.log(problems ? `FAIL: ${problems} problem(s)` : 'PASS');
process.exit(problems ? 1 : 0);
