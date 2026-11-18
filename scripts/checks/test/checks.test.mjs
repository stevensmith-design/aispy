// Run: node --test scripts/checks/test/
// Both document forms (the templates' and the reference review's) pass on the examples, and
// each form still fails when one of its own required parts is removed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const deliverable = path.join(root, 'scripts/checks/check-deliverable.mjs');
const mockCheck = path.join(root, 'scripts/checks/check-mock.mjs');
const ex = (d, f) => path.join(root, 'examples', d, f);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aispy-checks-'));
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8' });
const out = (r) => r.stdout + r.stderr;

const EXAMPLES = {
  brolga: { report: 'brolga-jp-localisation-review.html', ia: 'brolga-jp-ia-analysis.html', mock: 'brolga-jp-mock-pdp-mobile.html' },
  mareo: { report: 'mareo-jp-localisation-review-draft.html', ia: 'mareo-jp-ia-analysis-draft.html', mock: 'mareo-jp-mock-pdp-mobile.html' },
};
const runDoc = (d, file, type) => {
  const e = EXAMPLES[d];
  return node([deliverable, file, '--type', type, '--localisation', '--report', ex(d, e.report), '--ia', ex(d, e.ia)]);
};
// Write a changed copy of an example document and check it.
const mutate = (d, key, type, from, to) => {
  const src = fs.readFileSync(ex(d, EXAMPLES[d][key]), 'utf8');
  assert.ok(src.includes(from), `fixture text not found: ${from}`);
  const f = path.join(tmp, `${d}-${key}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(f, src.split(from).join(to));
  return runDoc(d, f, type);
};

for (const d of Object.keys(EXAMPLES)) {
  for (const [key, type] of [['index', 'index'], ['report', 'report'], ['ia', 'ia'], ['mock', 'mock']]) {
    const file = key === 'index' ? ex(d, 'index.html') : ex(d, EXAMPLES[d][key]);
    test(`${d}: ${type} passes check-deliverable`, () => {
      const r = runDoc(d, file, type);
      assert.equal(r.status, 0, out(r));
    });
  }
}

test('check-mock reads each note once (not the no-script copy)', () => {
  const r = node([mockCheck, '--mock', ex('mareo', EXAMPLES.mareo.mock)]);
  const line = out(r).split('\n').find((l) => l.startsWith('Notes:'));
  assert.equal(line.replace('Notes: ', '').split(', ').length, 15, line);
});

// Reference form: each of its own parts is still required.
test('reference report: a finding missing from the summary by perspective fails', () => {
  const r = mutate('mareo', 'report', 'report', '<a href="#f3">', '<a href="#x3">');
  assert.equal(r.status, 1); assert.match(out(r), /not listed by perspective: f3/);
});
test('reference report: a summary dot that disagrees with the finding fails', () => {
  const src = fs.readFileSync(ex('mareo', EXAMPLES.mareo.report), 'utf8');
  const i = src.indexOf('<a href="#f10">'); const j = src.indexOf('class="dot mid"', i);
  const f = path.join(tmp, 'mareo-dot.html');
  fs.writeFileSync(f, src.slice(0, j) + 'class="dot high"' + src.slice(j + 'class="dot mid"'.length));
  const r = runDoc('mareo', f, 'report');
  assert.equal(r.status, 1); assert.match(out(r), /priority dot differs[^\n]*f10/);
});
test('reference report: a missing appendix subsection fails', () => {
  const r = mutate('mareo', 'report', 'report', 'A3 · ', 'Limits · ');
  assert.equal(r.status, 1); assert.match(out(r), /appendix: missing subsections A3/);
});
test('reference report: a finding without a proposal fails', () => {
  const src = fs.readFileSync(ex('mareo', EXAMPLES.mareo.report), 'utf8');
  const out6 = src.replace(/(<article class="finding" id="f6"[\s\S]*?)class="prop"/g, '$1class="x"');
  assert.notEqual(out6, src);
  const f = path.join(tmp, 'mareo-noprop.html'); fs.writeFileSync(f, out6);
  const r = runDoc('mareo', f, 'report');
  assert.equal(r.status, 1); assert.match(out(r), /f6: missing proposal/);
});
test('reference IA: page maps without a legend fail', () => {
  const r = mutate('mareo', 'ia', 'ia', 'class="legend-row"', 'class="legend"');
  assert.equal(r.status, 1); assert.match(out(r), /pages: missing legend/);
});
test('reference IA: an out-of-scope task needs its label', () => {
  const r = mutate('mareo', 'ia', 'ia', '<span class="metric">out of scope</span>', '<span class="metric">1 step</span>');
  assert.equal(r.status, 1); assert.match(out(r), /task 7: missing route/);
});

// Template form: unchanged requirements.
test('template report: "why it matters" is still required', () => {
  const src = fs.readFileSync(ex('brolga', EXAMPLES.brolga.report), 'utf8');
  const f = path.join(tmp, 'brolga-nowhy.html'); fs.writeFileSync(f, src.replace(/class="why"/g, 'class="w"'));
  const r = runDoc('brolga', f, 'report');
  assert.equal(r.status, 1); assert.match(out(r), /missing [^\n]*why it matters/);
});
test('template report: a High/Medium finding without a local example still fails', () => {
  const src = fs.readFileSync(ex('brolga', EXAMPLES.brolga.report), 'utf8');
  const f = path.join(tmp, 'brolga-noref.html'); fs.writeFileSync(f, src.replace(/<div class="ref"/g, '<div class="r-x"'));
  const r = runDoc('brolga', f, 'report');
  assert.equal(r.status, 1); assert.match(out(r), /local example \(required on High\/Medium\)/);
});

// Mock notes in Japanese, both note forms, and per-language counting.
const li = (k, inner) => `<li><span class="k">${k}</span><div>${inner}</div></li>`;
const mockHtml = (langs) => `<!doctype html><html><body>${langs.map(([lang, notes]) => `<template id="t-${lang}">
<div class="current"><span class="mk">1</span><span class="mk">2</span><div class="fixed"></div></div>
<div id="proposed"><span class="mk">1</span><span class="mk">2</span><span class="mk">D1</span></div>
<div class="notes"><ol>${notes.join('')}</ol></div><img data-asset="site" alt=""></template>`).join('')}
<noscript><div class="notes"><ol>${langs[0][1].join('')}</ol></div></noscript></body></html>`;
const runMock = (html) => { const f = path.join(tmp, `mock-${Math.random().toString(36).slice(2)}.html`); fs.writeFileSync(f, html); return node([mockCheck, '--mock', f]); };
const JA_REF = [
  li('1', '<b>和文の書体</b><p>和文フォントを追加し、行間を広げる。</p><span class="f">指摘 1</span>'),
  li('2', '<b>価格に税込</b><p>価格を最初の画面に置く。</p><span class="f">ローカライズレビュー 2</span>'),
  li('D1', '<b>ギャラリー</b><p>デザイン提案：枚数カウンター付きのスワイプ。</p>'),
];
const EN_NOWTHEN = [
  li('1', '<b>Type</b><p class="now">Now: Latin rules.</p><p class="then">Proposed: a Japanese stack.</p><span class="f">Report finding 1</span>'),
  li('2', '<b>Price</b><p class="now">Now: no 税込.</p><p class="then">Proposed: 税込 on the first screen.</p><span class="f">Report finding 2</span>'),
  li('D1', '<b>Gallery</b><p>Design judgement: a swipe gallery.</p>'),
];

test('Japanese notes: citations and デザイン提案 are accepted', () => {
  const r = runMock(mockHtml([['ja', JA_REF]]));
  assert.equal(r.status, 0, out(r));
});
test('Japanese notes: a note with no citation still fails', () => {
  const notes = [...JA_REF]; notes[0] = li('1', '<b>和文の書体</b><p>和文フォントを追加する。</p><span class="f">参考</span>');
  const r = runMock(mockHtml([['ja', notes]]));
  assert.equal(r.status, 1); assert.match(out(r), /note 1 doesn't cite/);
});
test('Japanese notes: a D note that does not say it is a design proposal still fails', () => {
  const notes = [...JA_REF]; notes[2] = li('D1', '<b>ギャラリー</b><p>スワイプ式にする。</p>');
  const r = runMock(mockHtml([['ja', notes]]));
  assert.equal(r.status, 1); assert.match(out(r), /D1 is a design proposal/);
});
test('a note with neither Now / Proposed nor title, paragraph and source fails', () => {
  const notes = [...EN_NOWTHEN]; notes[0] = li('1', '<p>Report finding 1: a Japanese stack.</p>');
  const r = runMock(mockHtml([['en', notes]]));
  assert.equal(r.status, 1); assert.match(out(r), /without a Now \/ Proposed pair[^\n]*: 1$/m);
});
test('two languages and a no-script copy: each list is counted once, per language', () => {
  // 17 English notes + 3 Japanese + a no-script copy of the English: 37 if all were counted together.
  const en = [EN_NOWTHEN[2], ...Array.from({ length: 16 }, (_, i) => EN_NOWTHEN[i % 2])];
  const r = runMock(mockHtml([['en', en], ['ja', JA_REF]]));
  assert.doesNotMatch(out(r), /notes: keep the mock/);
  assert.match(out(r), /\[en\][\s\S]*\[ja\]/);
});
test('more than 18 notes in one language still fails', () => {
  const r = runMock(mockHtml([['en', Array.from({ length: 19 }, (_, i) => EN_NOWTHEN[i % 2])]]));
  assert.equal(r.status, 1); assert.match(out(r), /19 notes: keep the mock/);
});
