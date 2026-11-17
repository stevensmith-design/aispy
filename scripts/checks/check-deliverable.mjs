#!/usr/bin/env node
// Template check for an assembled deliverable (report, IA analysis, mock, index).
// Usage: node check-deliverable.mjs <file.html> [--type report|ia|mock|index]
//          [--localisation] [--forbid "Name,Org"] [--report report.html] [--tokens 03-system/tokens.json]
// Checks, per language template (<template id="t-xx">):
//   - every required section is present (see SPEC below); conditional ones reported, not failed
//   - report: every finding has its full anatomy; High/Medium have a local example; markers in
//     a finding's screenshots carry its own number; summary links point to real findings
//   - ia: 6–8 task cards, each with a verdict count, a route and local examples; three nav
//     trees; a layout card with bars, shares and a written "what it shows" line per page type
//   - index: cards and 3–5 key messages
//   - mock: runs check-mock.mjs
//   - languages carry the same sections and the same findings
// And for the whole file: no sample content left (data-sample, the sample brand, .ph-img,
// {{fields}}), no forbidden names (--forbid: names that were NOT supplied at intake, such as
// the account owner's name or organisation), in-page #links resolve, and theme contrast.
// Exit 1 on any failure. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const file = argv.find((x) => !x.startsWith('--') && !argv[argv.indexOf(x) - 1]?.startsWith('--'));
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : null; };
if (!file) { console.error('Usage: node check-deliverable.mjs <file.html> [--type report|ia|mock|index] [--localisation] [--forbid "A,B"]'); process.exit(2); }

const raw = fs.readFileSync(file, 'utf8');
const html = raw.replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, '').replace(/window\.__IMG=\{[^\n]*\};/, '');
const type = opt('type') || (html.match(/data-doc="(\w+)"/) || [])[1];
if (!type) { console.error('Cannot tell the document type: pass --type'); process.exit(2); }

const SPEC = {
  report: { required: ['about', 'summary', 'findings', 'directions', 'crosscheck', 'next', 'questions', 'appendix', 'a1', 'a2', 'a3', 'a4', 'a5'], localisation: ['market', 'compare'] },
  ia: { required: ['summary', 'nav', 'layout', 'headings', 'paths', 'labels', 'ia-findings', 'proposal', 'candidates', 'notes'] },
  index: { required: ['docs', 'keys', 'read', 'how', 'limits'] },
  mock: { required: ['device'] },
};
let fail = 0; let warn = 0;
const bad = (m) => { console.log(`  ✗ ${m}`); fail++; };
const note = (m) => { console.log(`  ! ${m}`); warn++; };
const ok = (m) => console.log(`  ✓ ${m}`);
const text = (h) => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ');
const noComments = html.replace(/<!--[\s\S]*?-->/g, '');

// ---------- whole file ----------
console.log(`${path.basename(file)} · ${type}`);
if (/\bdata-sample\b/.test(noComments)) bad('data-sample still on a template: the sample content has not been replaced (remove the attribute once it has)');
if (/Tidewell|tidewell\.example|Kumo Gear|Sanroku/.test(text(html))) bad('sample names from the template are still in the text (Tidewell, Kumo Gear, Sanroku)');
const ph = (noComments.match(/class="[^"]*\bph-img\b/g) || []).length;
if (ph) bad(`${ph} image placeholder(s) (.ph-img) left: use a real capture, or a caption saying why there is none`);
const fields = noComments.match(/\{\{[^}]{1,80}\}\}/g) || [];
if (fields.length) bad(`${fields.length} unfilled field(s), e.g. ${fields.slice(0, 3).join(' ')}`);
if (opt('forbid')) {
  const t = text(html);
  for (const n of String(opt('forbid')).split(',').map((x) => x.trim()).filter(Boolean)) {
    if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(t)) bad(`name not supplied at intake appears in the text: "${n}"`);
  }
}

// ---------- theme contrast ----------
const root = (html.match(/:root\s*\{([\s\S]*?)\}/) || [])[1] || '';
const vars = Object.fromEntries([...root.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-f]{3,8})\b/gi)].map((m) => [m[1], m[2]]));
const lum = (hex) => {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRS = [['text', 'canvas'], ['text-2', 'canvas'], ['text-2', 'surface'], ['#fff', 'brand'], ['#fff', 'deep'], ['#fff', 'issue'], ['deep', 'surface'], ['issue', 'surface'], ['good', 'good-bg'], ['#fff', 'role-decide'], ['text', 'role-reassure'], ['text', 'role-persuade'], ['text', 'role-sell'], ['text', 'role-navigate']];
if (Object.keys(vars).length) {
  const low = [];
  for (const [f, b] of PAIRS) {
    const fv = f.startsWith('#') ? '#ffffff' : vars[f]; const bv = vars[b];
    if (!fv || !bv) continue;
    const r = ratio(fv, bv); if (r < 4.5) low.push(`${f} on ${b} ${r.toFixed(2)}:1`);
  }
  low.length ? bad(`theme contrast below 4.5:1: ${low.join(', ')}`) : ok('theme contrast pairs pass 4.5:1');
} else note('no theme :root found to check contrast');
if (opt('tokens')) {
  // Every theme colour that names a source token must exist in the extracted tokens.json.
  const tok = fs.readFileSync(String(opt('tokens')), 'utf8').toUpperCase();
  const lines = [...root.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-f]{3,8})\s*;\s*\/\*\s*([^*]*)\*\//gi)];
  const off = lines.filter(([, , v, c]) => !/default|derived|lighten|at \d+%|^(deep|good|border-strong)\b/i.test(c.trim()) && !tok.includes(v.toUpperCase()));
  const defs = lines.filter(([, , , c]) => /default/i.test(c)).map((m) => m[1]);
  if (!lines.length) bad('theme has no source-token comments: generate it with theme-from-tokens.mjs or name each source token');
  else if (off.length) bad(`theme colours not found in the extracted tokens: ${off.map((m) => `--${m[1]} ${m[2]}`).join(', ')}`);
  else ok(`theme mapped from the extracted tokens (${lines.length} values${defs.length ? `; template defaults: ${defs.join(', ')}` : ''})`);
}

// ---------- per language ----------
const tpls = [...html.matchAll(/<template id="t-(\w+)"[^>]*>([\s\S]*?)<\/template>/g)].map((m) => ({ lang: m[1], body: m[2] }));
if (!tpls.length) tpls.push({ lang: 'doc', body: html });
const perLang = [];
for (const { lang, body } of tpls) {
  console.log(`[${lang}]`);
  const b = body.replace(/<!--[\s\S]*?-->/g, '');
  const ids = new Set([...b.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const spec = SPEC[type] || { required: [] };
  const miss = spec.required.filter((i) => !ids.has(i));
  miss.length ? bad(`required sections missing: ${miss.join(', ')}`) : ok(`required sections present (${spec.required.length})`);
  if (spec.localisation) {
    const lm = spec.localisation.filter((i) => !ids.has(i));
    if (opt('localisation') && lm.length) bad(`localisation review: missing ${lm.join(', ')}`);
    else if (lm.length) note(`conditional sections absent (fine for a general review): ${lm.join(', ')}`);
  }
  const deadLinks = [...b.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((h) => !ids.has(h));
  if (deadLinks.length) bad(`in-page links to missing ids: ${[...new Set(deadLinks)].slice(0, 6).join(', ')}`);

  const fids = [];
  if (type === 'report') {
    const arts = [...b.matchAll(/<article[^>]*class="[^"]*\bfinding\b[^"]*"[^>]*>([\s\S]*?)<\/article>/g)];
    if (!arts.length) bad('no findings (<article class="finding">)');
    const byPage = /class="area"/.test(b);
    if (byPage) {
      const secs = [...b.matchAll(/<div class="page-sec"[\s\S]*?(?=<div class="page-sec"|<\/section>)/g)].map((m) => m[0]);
      const noFigs = secs.filter((x) => !/class="figs"[\s\S]*?<figure/.test(x)).length;
      noFigs ? bad(`${noFigs} page section(s) without annotated screens in the column`) : ok(`by-page layout: ${secs.length} page section(s), each with its screens`);
    }
    // Top of report: screens reviewed and the tally, which must match the findings.
    if (!/class="screens"[\s\S]*?<figure/.test(b)) bad('about: no strip of the screens reviewed (.screens)');
    const tally = (b.match(/class="tally"[\s\S]*?<\/div>\s*<\/div>/) || [''])[0];
    if (!tally) bad('about: no findings tally (.tally)');
    else {
      const nums = [...tally.matchAll(/<b>(\d+)<\/b>/g)].map((m) => +m[1]);
      const more = (b.match(/<table class="tbl more"[\s\S]*?<\/table>/) || [''])[0];
      const hi = arts.filter((m) => /prio high/.test(m[0])).length + (more.match(/dot high/g) || []).length;
      const mi = arts.filter((m) => /prio mid/.test(m[0])).length + (more.match(/dot mid/g) || []).length;
      const lo = arts.filter((m) => /prio low/.test(m[0])).length;
      if (nums[0] !== undefined && nums[0] !== arts.length && nums[0] !== arts.length + (nums[3] || 0) - lo) note(`tally says ${nums[0]} findings; the document has ${arts.length} finding cards (fine if Low items are listed in A2)`);
      if (nums[1] !== undefined && nums[1] !== hi) bad(`tally says ${nums[1]} High; the findings have ${hi}`);
      if (nums[2] !== undefined && nums[2] !== mi) bad(`tally says ${nums[2]} Medium; the findings have ${mi}`);
    }
    for (const m of arts) {
      const a = m[0];
      const id = (a.match(/\bid="([^"]+)"/) || [])[1] || '?';
      const no = ((a.match(/class="f-no"[^>]*>\s*([^<\s]+)/) || [])[1] || '').trim();
      fids.push(id);
      const lack = [];
      if (!/data-key="/.test(a)) lack.push('data-key');
      if (!no) lack.push('number');
      if (!/<h3[\s>]/.test(a)) lack.push('title');
      if (!/class="tag prio (high|mid|low)"/.test(a)) lack.push('priority');
      if (!/class="where"/.test(a)) lack.push('where');
      if (!/class="why"/.test(a)) lack.push('why it matters');
      if (!byPage && !/<figure/.test(a)) lack.push('screenshot');
      // Evidence crops: made with annotate.mjs (name ends -a@2x), shown at crop size.
      const own = a.replace(/<div class="ref"[\s\S]*?<\/div>\s*(?=<div class="prop"|<p class="ask"|$)/, '');
      for (const im of own.matchAll(/<img[^>]*>/g)) {
        const t = im[0]; const src = (t.match(/data-src="([^"]+)"/) || [])[1];
        if (!src) continue;
        const h = +((t.match(/\bheight="(\d+)"/) || [])[1] || 0);
        if (!/-a@2x\.(png|jpe?g)$/i.test(src)) lack.push(`evidence "${src}" isn't an annotated crop (annotate.mjs)`);
        else if (h > 520) lack.push(`evidence "${src}" is ${h} px tall: crop tighter or split it`);
      }
      if (!/class="prop"/.test(a)) lack.push('proposal');
      if (!/class="because"/.test(a)) lack.push('why it will work');
      if (!/class="measure"/.test(a)) lack.push('metric to check');
      if (/prio (high|mid)/.test(a) && !/class="ref"/.test(a)) lack.push('local example (required on High/Medium)');
      if (lack.length) bad(`${id}: missing ${lack.join(', ')}`);
      const mks = [...a.matchAll(/<span class="mk"[^>]*>([^<]+)</g)].map((x) => x[1].trim()).filter((x) => x !== no);
      if (mks.length) bad(`${id}: screenshot markers ${[...new Set(mks)].join(', ')} don't match the finding number ${no}`);
    }
    if (arts.length) ok(`${arts.length} findings checked`);
    if (!byPage && arts.length > 15) bad(`${arts.length} main findings: group problems that share a cause or a fix into 12–15, and move standalone Medium items to the further-findings table`);
  }
  if (type === 'ia') {
    const tasks = [...b.matchAll(/<div class="task">([\s\S]*?)(?=<div class="task">|<\/section>)/g)].map((m) => m[1]);
    if (tasks.length < 6 || tasks.length > 8) bad(`${tasks.length} task cards (need 6–8)`); else ok(`${tasks.length} task cards`);
    tasks.forEach((t, i) => {
      const lack = [];
      if (!/class="metric/.test(t)) lack.push('verdict with a count');
      if (!/class="flow"[\s\S]*?class="st/.test(t)) lack.push('route');
      if (!/class="st g"/.test(t)) lack.push('local site examples');
      if (lack.length) bad(`task ${i + 1}: missing ${lack.join(', ')}`);
    });
    const trees = (b.match(/class="tree"/g) || []).length;
    trees < 3 ? bad(`${trees} navigation trees (need client, benchmark, proposed)`) : ok('three navigation trees');
    const cards = [...b.matchAll(/<div class="layoutcard"[^>]*id="layout-[^"]*"[\s\S]*?(?=<div class="layoutcard"|<\/section>)/g)].map((m) => m[0]);
    if (!cards.length) bad('no page-layout cards (.layoutcard id="layout-…")');
    for (const c of cards) {
      const id = (c.match(/id="(layout-[^"]+)"/) || [])[1];
      const lack = [];
      if (!/class="pmap"/.test(c)) lack.push('bars');
      if (!/class="shares"/.test(c)) lack.push('role shares');
      if (!/class="r prop"/.test(c)) lack.push('proposed bar');
      if (!/class="reads"/.test(c)) lack.push('"what it shows" line');
      else if (!/(#f\d+|#\d+|IA-\d+)/.test((c.match(/class="reads"[\s\S]*?<\/p>/) || [''])[0])) lack.push('finding link in "what it shows"');
      if (lack.length) bad(`${id}: missing ${lack.join(', ')}`);
    }
    if (cards.length) ok(`${cards.length} page-layout card(s)`);
    for (const m of b.matchAll(/<td>(IA-\d+)<\/td>/g)) fids.push(m[1]);
  }
  if (type === 'index') {
    const cards = (b.match(/class="card"/g) || []).length; const keys = (b.match(/class="key"/g) || []).length;
    cards < 2 ? bad(`${cards} deliverable cards`) : ok(`${cards} deliverable cards`);
    keys < 3 || keys > 5 ? bad(`${keys} key messages (need 3–5)`) : ok(`${keys} key messages`);
  }
  perLang.push({ lang, ids, fids });
}
if (perLang.length > 1) {
  const [a, ...rest] = perLang;
  for (const o of rest) {
    const d1 = [...a.ids].filter((i) => !o.ids.has(i)); const d2 = [...o.ids].filter((i) => !a.ids.has(i));
    if (d1.length || d2.length) bad(`${a.lang} and ${o.lang} differ in ids: ${[...d1.map((x) => `-${x}`), ...d2.map((x) => `+${x}`)].slice(0, 8).join(' ')}`);
    else ok(`${a.lang} and ${o.lang} carry the same sections and findings`);
    if (a.fids.join() !== o.fids.join()) bad(`${a.lang} and ${o.lang} list findings in a different order or number`);
  }
}

if (type === 'mock') {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const args = [path.join(here, 'check-mock.mjs'), '--mock', file];
  if (opt('report')) args.push('--report', opt('report'));
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  process.stdout.write(r.stdout.split('\n').map((l) => (l ? `  ${l}` : l)).join('\n'));
  if (r.status) fail++;
}

console.log(fail ? `FAIL: ${fail} problem(s)${warn ? `, ${warn} note(s)` : ''}.` : `PASS${warn ? ` with ${warn} note(s)` : ''}. Structure only: the fact and design checks still decide whether the content is right.`);
process.exit(fail ? 1 : 0);
