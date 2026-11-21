// Run: node --test scripts/build/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const assemble = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assemble.mjs');

// A valid w×h PNG, so assemble.mjs can read its size.
function png(w, h) {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(h * (1 + w * 3));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function run(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aispy-assemble-'));
  fs.mkdirSync(path.join(dir, 'img'));
  fs.writeFileSync(path.join(dir, 'img', 'crop@2x.png'), png(400, 200));
  fs.writeFileSync(path.join(dir, 'img', 'plain.png'), png(40, 20));
  fs.writeFileSync(path.join(dir, 'src.html'), `<html><body>${body}</body></html>`);
  const out = path.join(dir, 'out.html');
  const r = spawnSync(process.execPath, [assemble, path.join(dir, 'src.html'), out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return fs.readFileSync(out, 'utf8').match(/<img\b[^>]*>/g);
}
const styles = (tag) => tag.match(/\sstyle=/g) || [];

test('an @2x image without a style gets one, as before', () => {
  const [img] = run('<img src="img/crop@2x.png" alt="a">');
  assert.equal(img, '<img data-img="0" data-src="img/crop@2x.png" width="200" height="100" style="width:200px" alt="a">');
});

test('an @2x image that has its own style gets one style attribute, with the width first', () => {
  const [before, after, single] = run([
    '<img style="border:1px solid" src="img/crop@2x.png" alt="a">',
    '<img src="img/crop@2x.png" style="border:1px solid" alt="b">',
    "<img src=\"img/crop@2x.png\" style='margin:0' alt=\"c\">",
  ].join(''));
  for (const img of [before, after, single]) assert.equal(styles(img).length, 1, img);
  assert.equal(before, '<img style="width:200px;border:1px solid" data-img="0" data-src="img/crop@2x.png" width="200" height="100" alt="a">');
  assert.equal(after, '<img data-img="0" data-src="img/crop@2x.png" width="200" height="100" style="width:200px;border:1px solid" alt="b">');
  assert.equal(single, "<img data-img=\"0\" data-src=\"img/crop@2x.png\" width=\"200\" height=\"100\" style='width:200px;margin:0' alt=\"c\">");
});

test('images with their own width, or not @2x, keep their style unchanged', () => {
  const [sized, plain] = run('<img src="img/crop@2x.png" width="390" style="left:0" alt=""><img src="img/plain.png" style="top:0" alt="">');
  assert.equal(sized, '<img data-img="0" data-src="img/crop@2x.png" width="390" style="left:0" alt="">');
  assert.equal(plain, '<img data-img="1" data-src="img/plain.png" style="top:0" alt="">');
});
