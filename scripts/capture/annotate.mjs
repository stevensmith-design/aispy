#!/usr/bin/env node
// Evidence images for findings: crop a capture to the element in question and mark it, the way
// the reference review did (a red outline round the problem, the finding number on its corner,
// nothing else: the caption under the image says what it shows). Every screenshot in a finding
// goes through this.
// Usage: node annotate.mjs spec.json            (spec: one object or an array)
// {
//   "image": "02-capture/mobile/plus-full.png",   // full-page or screen capture
//   "scale": 2,                                   // capture's device pixel ratio
//   "crop": { "x": 0, "y": 560, "w": 390, "h": 300 },   // CSS px; omit for the whole image
//   "marks": [ { "n": 2, "x": 16, "y": 600, "w": 360, "h": 64 } ],
//   "out": "07-deliverables/src/img/f2-plus-name"       // writes <out>-a@2x.png
// }
// Paths are relative to the spec file. Coordinates are CSS px on the full page, the same as the
// capture's structure.json boxes.
// Crop rule: the element plus enough context to recognise where it is, usually 320–700 px wide
// and no taller than about 400 px (split a tall area into two crops). Leave ~26 px above each
// outline for its number. A whole screen is for the by-page layout's screen column and
// the mock, not for a finding. A mark with w/h draws an outline; without, only the number.
// No text labels on the image: the number identifies the finding and the caption explains it.
// "color" overrides the red (use the theme's --issue).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
if (!file) { console.error('Usage: node annotate.mjs spec.json'); process.exit(2); }
const specs = [].concat(JSON.parse(fs.readFileSync(file, 'utf8')));
const base = path.dirname(path.resolve(file));
const launch = () => chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
  .catch(() => chromium.launch({ channel: 'chrome' }));
const browser = await launch();
let n = 0; let warn = 0;
for (const s of specs) {
  const scale = Number(s.scale || 1);
  const imgPath = path.resolve(base, s.image);
  const b64 = fs.readFileSync(imgPath).toString('base64');
  const mime = /\.jpe?g$/i.test(imgPath) ? 'image/jpeg' : 'image/png';
  const probe = await browser.newPage();
  await probe.setContent(`<img id="i" src="data:${mime};base64,${b64}">`);
  await probe.waitForFunction(() => document.getElementById('i').complete);
  const nat = await probe.evaluate(() => ({ w: document.getElementById('i').naturalWidth, h: document.getElementById('i').naturalHeight }));
  await probe.close();
  const crop = s.crop || { x: 0, y: 0, w: nat.w / scale, h: nat.h / scale };
  if (crop.h > 700 || crop.w > 760) { console.log(`  ! ${s.out}: crop ${crop.w}×${crop.h} CSS px is large for a finding; crop to the element unless this is a screen column`); warn++; }
  const color = s.color || '#C0362D';
  const W = Math.ceil(crop.w); const H = Math.ceil(crop.h);
  const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  await page.setContent(`<html><head><style>
    body{margin:0}
    #w{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#fff}
    #w>img{position:absolute;left:${-crop.x}px;top:${-crop.y}px;width:${nat.w / scale}px;height:${nat.h / scale}px;max-width:none}
    .box{position:absolute;border:2px solid ${color};border-radius:4px;box-sizing:border-box}
    .mk{position:absolute;min-width:20px;height:20px;padding:0 5px;border-radius:5px;background:${color};color:#fff;
        font:700 12px/20px "Helvetica Neue",Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff;box-sizing:border-box}
    .lab{position:absolute;background:${color};color:#fff;font:600 11px/20px "Helvetica Neue",Arial,"Hiragino Sans","Noto Sans JP",sans-serif;
        height:20px;padding:0 7px;border-radius:4px;white-space:nowrap;box-shadow:0 0 0 2px #fff}
  </style></head><body><div id="w"><img src="data:${mime};base64,${b64}"></div></body></html>`);
  await page.waitForFunction(() => document.querySelector('#w>img').complete);
  await page.evaluate(({ marks, crop }) => {
    const w = document.getElementById('w');
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    for (const m of marks || []) {
      const x = m.x - crop.x; const y = m.y - crop.y;
      if (m.w && m.h) {
        const b = document.createElement('div'); b.className = 'box';
        Object.assign(b.style, { left: x + 'px', top: y + 'px', width: m.w + 'px', height: m.h + 'px' }); w.appendChild(b);
      }
      // Number (and label) sit just above the outline, so they never cover the evidence;
      // inside the top edge only when the crop leaves no room above.
      const top = y - 24 >= 2 ? y - 24 : clamp(y + 2, 2, crop.h - 22); const left = clamp(x, 2, crop.w - 24);
      const k = document.createElement('div'); k.className = 'mk'; k.textContent = m.n;
      Object.assign(k.style, { left: left + 'px', top: top + 'px' }); w.appendChild(k);
      if (m.label && process.env.ANNOTATE_LABELS === "1") {
        const l = document.createElement('div'); l.className = 'lab'; l.textContent = m.label; w.appendChild(l);
        Object.assign(l.style, { left: clamp(left + k.offsetWidth + 4, 2, crop.w - l.offsetWidth - 2) + 'px', top: top + 'px' });
      }
    }
  }, { marks: s.marks, crop });
  const out = path.resolve(base, `${s.out}-a@2x.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.locator('#w').screenshot({ path: out });
  await ctx.close();
  console.log(`  ✓ ${path.relative(process.cwd(), out)} (${W}×${H} CSS px, ${(s.marks || []).length} mark(s))`);
  n++;
}
await browser.close();
console.log(`${n} image(s)${warn ? `, ${warn} large-crop warning(s)` : ''}`);
