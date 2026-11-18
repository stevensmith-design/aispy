#!/usr/bin/env node
// Site inventory for review scoping. Node 18+, no dependencies (--measure uses the Playwright
// installed in scripts/capture/; see docs/how-to-use.md).
// Usage: node inventory.mjs --site https://jp.example.com --out scoping/ [--limit 400]
//        [--concurrency 3] [--measure] [--sitemap https://…/sitemap.xml]
// Writes: inventory.csv (one row per URL), types.md (grouped page types, fill in tiers),
//         broken.md (non-200 URLs). Polite by default: 3 parallel requests, 300 ms apart.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
if (!a.site || !a.out) { console.error('Usage: node inventory.mjs --site https://example.com --out scoping/ [--limit 400] [--measure]'); process.exit(2); }
const site = a.site.replace(/\/$/, '');
const out = path.resolve(a.out); fs.mkdirSync(out, { recursive: true });
const limit = Number(a.limit || 400), conc = Number(a.concurrency || 3);
const UA = 'Mozilla/5.0 (compatible; review-inventory/0.1)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual' });
    const loc = r.headers.get('location');
    const body = r.status === 200 ? await r.text() : '';
    return { status: r.status, location: loc, body };
  } catch (e) { return { status: 0, error: e.message, body: '' }; }
}

async function sitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const { status, body } = await get(url);
  if (status !== 200) { console.error(`sitemap ${url}: HTTP ${status}`); return []; }
  const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(body)) {
    let all = [];
    for (const l of locs) all = all.concat((await sitemapUrls(l, seen)).map((u) => ({ ...u, sitemap: u.sitemap || l.split('/').pop().split('?')[0] })));
    return all;
  }
  return locs.map((loc) => ({ url: loc, sitemap: url.split('/').pop().split('?')[0] }));
}

function classify(url, html) {
  const shopTemplate = (html.match(/template--(\d+)__/) || [])[1] || null;
  const pageType = (html.match(/"pageType"\s*:\s*"([^"]+)"/) || [])[1]
    || (html.match(/<meta[^>]+property="og:type"[^>]+content="([^"]+)"/) || [])[1] || null;
  // Layout fingerprint: ordered section types with IDs and numbers stripped, so two pages with
  // the same layout but different content match.
  const sections = [...html.matchAll(/<(?:section|div)[^>]+id="shopify-section-([^"]+)"/g)].map((m) => m[1]
    .replace(/^template--\d+__/, '').replace(/_[A-Za-z0-9]{6,}$/, '').replace(/\d+/g, ''));
  const generic = sections.length ? null : [...html.matchAll(/<(section|main|header|footer)\b[^>]*class="([^"]*)"/g)]
    .map((m) => `${m[1]}.${m[2].split(/\s+/)[0]}`).slice(0, 40);
  const fp = (sections.length ? sections : generic || []).join('>');
  const seg = new URL(url).pathname.split('/').filter(Boolean)[0] || '(home)';
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1]?.trim() || '';
  return { shopTemplate, pageType, seg, fp, title };
}

const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36).slice(0, 6); };

const sm = await sitemapUrls(a.sitemap || `${site}/sitemap.xml`);
const urls = [{ url: `${site}/`, sitemap: '(home)' }, ...sm.filter((u) => u.url.replace(/\/$/, '') !== site)].slice(0, limit);
console.log(`${urls.length} URLs from sitemap${sm.length > limit ? ` (limited from ${sm.length})` : ''}`);
const rows = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const u = urls[i++];
    const r = await get(u.url);
    const c = r.status === 200 ? classify(u.url, r.body) : { seg: new URL(u.url).pathname.split('/').filter(Boolean)[0] || '(home)', fp: '' };
    rows.push({ ...u, status: r.status, location: r.location || '', soft404: r.status === 200 && /404|not found|ページが見つかりません/i.test(c.title || ''), ...c, fpId: c.fp ? hash(c.fp) : '' });
    await sleep(300);
  }
}
await Promise.all(Array.from({ length: conc }, worker));

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const cols = ['url', 'sitemap', 'status', 'location', 'soft404', 'seg', 'pageType', 'shopTemplate', 'fpId', 'title'];
fs.writeFileSync(path.join(out, 'inventory.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');

const ok = rows.filter((r) => r.status === 200 && !r.soft404);
const groups = {};
for (const r of ok) { const k = `${r.pageType || r.seg} · ${r.fpId}`; (groups[k] ||= []).push(r); }
const types = Object.entries(groups).sort((x, y) => y[1].length - x[1].length);

let measured = {};
if (a.measure) {
  let chromium;
  try { ({ chromium } = createRequire(new URL('../capture/package.json', import.meta.url))('playwright')); }
  catch { console.error('--measure needs Playwright: cd scripts/capture && npm install && npx playwright install chromium'); process.exit(2); }
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  for (const [k, rs] of types) {
    const p = await ctx.newPage();
    try {
      await p.goto(rs[0].url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await p.waitForTimeout(3000);
      const h = await p.evaluate(() => document.documentElement.scrollHeight);
      measured[k] = (h / 844).toFixed(1);
    } catch { measured[k] = '?'; }
    await p.close();
  }
  await browser.close();
}

const md = [`# Page types: ${site}`, '', `${rows.length} URLs checked, ${ok.length} OK, ${rows.length - ok.length} broken or redirected, ${types.length} layout groups.`, '',
  'Groups share a page type and a layout fingerprint. Merge groups that are the same type with small layout differences after looking at one page of each; fill in Tier and In scope.', '',
  '| Type · layout | Templates | URLs | Representative URL | Screens @390 | Tier | In scope? |', '|---|---|---|---|---|---|---|',
  ...types.map(([k, rs]) => `| ${k} | ${[...new Set(rs.map((r) => r.shopTemplate).filter(Boolean))].length || '–'} | ${rs.length} | ${rs[0].url} | ${measured[k] ?? '(run --measure)'} | | |`)];
fs.writeFileSync(path.join(out, 'types.md'), md.join('\n') + '\n');
const broken = rows.filter((r) => r.status !== 200 || r.soft404);
fs.writeFileSync(path.join(out, 'broken.md'), [`# Broken or redirected sitemap URLs (${broken.length})`, '', '| Status | URL | Redirects to |', '|---|---|---|',
  ...broken.map((r) => `| ${r.soft404 ? '200 (soft 404)' : r.status} | ${r.url} | ${r.location} |`)].join('\n') + '\n');
console.log(`Wrote ${out}/inventory.csv, types.md (${types.length} groups), broken.md (${broken.length})`);
