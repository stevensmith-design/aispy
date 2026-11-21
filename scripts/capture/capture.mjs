#!/usr/bin/env node
// Capture pages for a product review: screenshots, rendered DOM, structure, tokens, JA typography.
// Usage: node capture.mjs --urls urls.txt --out <dir> [--widths 390,1440] [--firstwait 15000] [--settle 3000]
//        [--screens 3] [--consent "Accept|#onetrust-accept-btn-handler"] [--lang ja] [--headed]
//
// Two capture sets per page and width, because each answers a different question:
//   A  <name>-<w>.png            full page with fixed/floating elements removed (for analysis);
//                                 what was removed is logged, never silently dropped
//   B  <name>-<w>-screen<N>.png  the first N screens exactly as a visitor sees them, with chat
//                                 buttons, coupon bubbles, sticky bars and badges left on
//                                 (for "current vs proposed" comparisons)
// capture-notes.md gets one section per run, so a second run into the same --out folder adds
// its notes after the first run's instead of replacing them.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCapturePages } from './input.mjs';
import { writeCaptureNotes } from './notes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
if (!args.urls || !args.out) {
  console.error('Usage: node capture.mjs --urls urls.txt --out <dir> [--widths 390,1440] [--settle 3000] [--consent "..."] [--lang ja]');
  process.exit(2);
}
const widths = String(args.widths || '390,1440').split(',').map(Number);
const settle = Number(args.settle || 3000);
const firstWait = Number(args.firstwait || 15000); // first visit: wait for modals, chat and coupons
const screens = Number(args.screens || 3);
const outDir = path.resolve(args.out);
fs.mkdirSync(outDir, { recursive: true });
const pages = parseCapturePages(fs.readFileSync(args.urls, 'utf8'));
const extractSrc = fs.readFileSync(path.join(here, 'extract-in-page.js'), 'utf8');
const consentTries = [
  ...(args.consent ? String(args.consent).split('|') : []),
  '#onetrust-accept-btn-handler', 'button[id*="accept" i]', 'button[class*="accept" i]',
  'text=/^(Accept all|Accept|Allow all|I agree|OK|同意する|すべて許可|すべて同意|同意して閉じる|閉じる)$/i',
];
const log = [`# Capture log ${new Date().toISOString()}`, ''];
let failures = 0;

async function dismissConsent(page) {
  for (const sel of consentTries) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 300 })) { await loc.click({ timeout: 1500 }); return sel; }
    } catch { /* try next */ }
  }
  return null;
}

async function wheelScroll(page) {
  // Real wheel events: some lazy loaders ignore window.scrollTo.
  let last = -1;
  for (let i = 0; i < 80; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(250);
    const y = await page.evaluate(() => scrollY + innerHeight);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    if (y >= h - 2 || y === last) break;
    last = y;
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: !args.headed, executablePath: process.env.CHROME_PATH || undefined });
try {
  for (const width of widths) {
    const mobile = width < 768;
    for (const { name, url } of pages) {
      // A fresh context per page, so every page is captured as a first visit (no shared cookies
      // or storage).
      const ctx = await browser.newContext({
        viewport: { width, height: mobile ? 844 : 900 },
        deviceScaleFactor: mobile ? 2 : 1,
        isMobile: mobile, hasTouch: mobile,
        locale: args.lang === 'ja' ? 'ja-JP' : undefined,
        userAgent: mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' : undefined,
      });
      const base = path.join(outDir, `${name}-${width}`);
      const page = await ctx.newPage();
      const notes = [];
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => notes.push('network never idle'));
        await page.waitForTimeout(firstWait);
        // "As seen" first screen, before anything is dismissed: modals, chat, coupons, banners.
        await page.screenshot({ path: `${base}-as-seen.png` });
        const c = await dismissConsent(page);
        notes.push(c ? `consent dismissed via ${c}` : 'no consent banner dismissed');
        await wheelScroll(page);
        await page.waitForTimeout(settle);
        const data = await page.evaluate(extractSrc);
        fs.writeFileSync(`${base}.structure.json`, JSON.stringify(data.structure, null, 1));
        fs.writeFileSync(`${base}.tokens.json`, JSON.stringify(data.tokens, null, 1));
        const pm = ['| # | Section | Starts at (px) | Screen | Length (screens) |', '|---|---|---|---|---|',
          ...(data.structure.sections || []).map((x) => `| ${x.i} | ${x.heading || x.id || '—'} | ${x.y} | ${x.screen} | ${x.screens} |`)];
        fs.writeFileSync(`${base}.page-map.md`, `# Page map: ${name} @ ${width}px (page ${data.structure.pageHeight}px)\n\n${pm.join('\n')}\n`);
        if (args.lang === 'ja') fs.writeFileSync(`${base}.ja.json`, JSON.stringify(data.ja, null, 1));
        // <base> keeps the saved page loading the site's own CSS and images, so the kit's detector
        // doesn't report artefacts from a page rendered without its theme.
        // Set B: first screens with everything on, before anything is hidden. Also record which
        // fixed/sticky elements are visible at each scroll position, so show/hide behaviour
        // (e.g. a sticky bar hidden while the main button is on screen) is described precisely.
        const vh = page.viewportSize().height;
        const fixedVisible = () => page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => {
          const s = getComputedStyle(e); if (!(s.position === 'fixed' || s.position === 'sticky')) return false;
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05 && r.bottom > 0 && r.top < innerHeight;
        }).map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 50), text: (e.innerText || '').trim().slice(0, 40), top: Math.round(e.getBoundingClientRect().top), h: Math.round(e.getBoundingClientRect().height) })));
        const timeline = [];
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        const stops = [...Array(screens).keys()].map((i) => i * vh).concat([Math.round(total * 0.25), Math.round(total * 0.5), Math.round(total * 0.75)]);
        for (const [i, y] of stops.entries()) {
          await page.evaluate((y) => scrollTo(0, y), y);
          await page.waitForTimeout(400);
          if (i < screens) await page.screenshot({ path: `${base}-screen${i + 1}.png` });
          timeline.push({ scrollY: y, visibleFixed: await fixedVisible() });
        }
        fs.writeFileSync(`${base}.fixed-timeline.json`, JSON.stringify(timeline, null, 1));
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(300);
        fs.writeFileSync(`${base}.html`, (await page.content()).replace(/<head([^>]*)>/i, `<head$1><base href="${page.url()}">`));
        // Set A: full page with fixed elements hidden and sticky ones unstuck, so they don't
        // repeat or cover content in a stitched full-page image. Log exactly what changed.
        const removed = await page.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll('body *')) {
            const s = getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (s.position === 'fixed') {
              out.push({ action: 'hidden', position: 'fixed', tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), text: (el.innerText || '').trim().slice(0, 50), w: Math.round(r.width), h: Math.round(r.height) });
              el.style.setProperty('visibility', 'hidden', 'important');
            } else if (s.position === 'sticky') {
              out.push({ action: 'unstuck', position: 'sticky', tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), text: (el.innerText || '').trim().slice(0, 50) });
              el.style.setProperty('position', 'relative', 'important');
            }
          }
          return out;
        });
        fs.writeFileSync(`${base}.removed.json`, JSON.stringify(removed, null, 1));
        notes.push(`full page: ${removed.filter((r) => r.action === 'hidden').length} fixed hidden, ${removed.filter((r) => r.action === 'unstuck').length} sticky unstuck (see .removed.json); ${screens} first screens kept intact`);
        await page.screenshot({ path: `${base}.png`, fullPage: true });
        notes.push(`height ${data.structure.pageHeight}px, ${data.structure.headings.length} headings, ${data.structure.links.length} links, fixed/sticky ${data.structure.fixed.length}`);
        if (/captcha|access denied|are you a robot|blocked/i.test(await page.title())) notes.push('POSSIBLE BLOCK: use manual capture');
      } catch (e) {
        failures++;
        notes.push(`ERROR ${e.message.split('\n')[0]}`);
      }
      log.push(`- **${name} @ ${width}** ${url}: ${notes.join('; ')}`);
      await page.close();
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  writeCaptureNotes(path.join(outDir, 'capture-notes.md'), log);
  console.log(`Wrote ${outDir}/capture-notes.md`);
}

if (failures) {
  console.error(`Capture failed for ${failures} page${failures === 1 ? '' : 's'}; see capture-notes.md.`);
  process.exitCode = 1;
}
