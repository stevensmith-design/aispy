// Run: node --test scripts/build/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../layout-bars.mjs');

function run(sections) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aispy-layout-'));
  const file = path.join(dir, 'layout.json');
  fs.writeFileSync(file, JSON.stringify({ screenPx: 844, pages: [{ id: 'pdp', title: 'Product page', rows: [{ label: 'Client', kind: 'client', sections }] }] }));
  const r = spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return r;
}

test('adjacent sections pass', () => {
  const r = run([
    { name: 'Gallery', role: 'persuade', top: 0, bottom: 844 },
    { name: 'Buy box', role: 'decide', top: 844, bottom: 1688 },
  ]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
});

test('an overlap within rounding (0.05 screens) passes', () => {
  const r = run([
    { name: 'Gallery', role: 'persuade', from: 0, to: 1.03 },
    { name: 'Buy box', role: 'decide', from: 1, to: 2 },
  ]);
  assert.equal(r.status, 0, r.stderr);
});

test('a nested section listed beside its parent fails and names both', () => {
  const r = run([
    { name: 'Hero section', role: 'persuade', top: 0, bottom: 1688 },
    { name: 'Hero image', role: 'persuade', top: 100, bottom: 800 },
    { name: 'Reviews', role: 'reassure', top: 1688, bottom: 2532 },
  ]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Hero image: overlaps Hero section/);
  assert.doesNotMatch(r.stderr, /Reviews/);
});

test('every child of a parent is flagged, not only the first', () => {
  const r = run([
    { name: 'Main', role: 'persuade', from: 0, to: 4 },
    { name: 'Child A', role: 'persuade', from: 0.5, to: 1 },
    { name: 'Child B', role: 'decide', from: 2, to: 3 },
  ]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Child A: overlaps Main/);
  assert.match(r.stderr, /Child B: overlaps Main/);
});

test('bar segments are colour only: no text in the segment, the name in data-tip', () => {
  const r = run([
    { name: 'Reviews', role: 'reassure', from: 0, to: 5 },
    { name: '足幅 · カラー · サイズ · カートに追加', role: 'decide', from: 5, to: 6 },
  ]);
  assert.equal(r.status, 0, r.stderr);
  const segs = [...r.stdout.matchAll(/<div class="s r-[a-z]+( e)?"[^>]*data-tip="([^"]*)">([^<]*)<\/div>/g)];
  assert.equal(segs.length, 2);
  assert.deepEqual(segs.map((m) => m[3]), ['', '']);
  assert.equal(segs[0][2], 'Reviews (screens 1–6)');
  assert.equal(segs[1][2], '足幅 · カラー · サイズ · カートに追加 (screens 6–7)');
  // A segment starting past the middle of the bar opens its tooltip leftwards.
  assert.deepEqual(segs.map((m) => !!m[1]), [false, true]);
  assert.doesNotMatch(r.stdout, /class="s [^"]*"[^>]*\stitle=/);
});
