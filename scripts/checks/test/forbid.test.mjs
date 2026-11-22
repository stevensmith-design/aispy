// Run: node --test scripts/checks/test/
// Terms here are made up or taken from the Brolga example; none is a real forbidden name.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenHits } from '../forbid.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const check = path.join(root, 'scripts/checks/check-deliverable.mjs');
const mock = path.join(root, 'examples/brolga/brolga-jp-mock-pdp-mobile.html');
const run = (forbid) => spawnSync(process.execPath, [check, mock, '--type', 'mock', '--forbid', forbid], { encoding: 'utf8' });

test('Latin terms match whole words only, any case', () => {
  assert.deepEqual(forbiddenHits('Made by Acme Ltd.', ['acme']), ['acme']);
  assert.deepEqual(forbiddenHits('Acmeville store', ['Acme']), []);
});

test('katakana term standing alone is a hit', () => {
  assert.deepEqual(forbiddenHits('ブランド名はミロです', ['ミロ']), ['ミロ']);
  assert.deepEqual(forbiddenHits('「ミロ」', ['ミロ']), ['ミロ']);
  assert.deepEqual(forbiddenHits('ミロ', ['ミロ']), ['ミロ']);
});

test('katakana term inside a longer katakana word is not a hit', () => {
  assert.deepEqual(forbiddenHits('カミロード店', ['ミロ']), []);
  assert.deepEqual(forbiddenHits('ミロー', ['ミロ']), []);
});

test('other Japanese terms match as substrings', () => {
  assert.deepEqual(forbiddenHits('潮見台家具の新作', ['潮見台']), ['潮見台']);
  assert.deepEqual(forbiddenHits('東京潮見台ストア', ['潮見台ストア']), ['潮見台ストア']);
});

test('check-deliverable fails on a katakana name standing alone', () => {
  const r = run('スウェル');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /name not supplied at intake/);
});

test('check-deliverable passes when the katakana term only occurs inside longer words', () => {
  const r = run('ガイド,シューズ');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// A name that appears only in an attribute (alt, title, aria-label, data-*) is caught too.
// "Zorblax" is made up.
const withAttr = (from, to) => {
  const src = fs.readFileSync(mock, 'utf8');
  assert.ok(src.includes(from), `fixture text not found: ${from}`);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aispy-forbid-')), 'mock.html');
  fs.writeFileSync(f, src.replace(from, to));
  return spawnSync(process.execPath, [check, f, '--type', 'mock', '--forbid', 'Zorblax'], { encoding: 'utf8' });
};

test('check-deliverable fails on a name only in an alt attribute', () => {
  const r = withAttr('alt="Live Swell 3 page at 390 px, full length"', 'alt="Zorblax page at 390 px, full length"');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /appears in an attribute \(alt, title, aria-label, data-…\): "Zorblax"/);
  assert.doesNotMatch(r.stdout, /appears in the text: "Zorblax"/);
});

test('check-deliverable fails on a name only in a data-* attribute', () => {
  const r = withAttr('data-src="', 'data-src="zorblax-');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /appears in an attribute[^\n]*"Zorblax"/);
});

test('check-deliverable passes when the forbidden name appears nowhere', () => {
  const r = withAttr('alt="Live Swell 3', 'alt="Live Swell 3');
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
