#!/usr/bin/env node
// Turn a filled template into one self-contained deliverable.
// Usage: node assemble.mjs src/report.html out/<client>-<market>-review-draft.html
// - inlines <link rel="stylesheet" href="local.css"> and <script src="local.js"></script>
// - embeds every local image (src="img/..") once as a data URI: <img data-img="n">, with the
//   map in window.__IMG, so EN and JA templates share one copy of each image
// - rewrites links to sibling templates (report.html, ia.html, mock.html, index.html) to the
//   output names given with --names report=x.html,ia=y.html,... (optional)
// No dependencies.
import fs from 'node:fs';
import path from 'node:path';

const [src, out, ...rest] = process.argv.slice(2);
if (!src || !out) { console.error('Usage: node assemble.mjs <src.html> <out.html> [--names report=a.html,ia=b.html,mock=c.html,index=index.html]'); process.exit(2); }
const dir = path.dirname(path.resolve(src));
let html = fs.readFileSync(src, 'utf8');
const local = (p) => p && !/^(data:|https?:|\/\/|#|mailto:)/i.test(p);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };

html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (m, href) => {
  if (!local(href)) return m;
  return `<style>\n${fs.readFileSync(path.join(dir, href), 'utf8')}\n</style>`;
});
html = html.replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (m, s) => {
  if (!local(s)) return m;
  return `<script>\n${fs.readFileSync(path.join(dir, s), 'utf8')}\n</script>`;
});

function dims(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xc2) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
// Adds a width to the style attribute among these attributes, if there is one; returns null if
// there isn't. Attributes are read one at a time, so text that looks like style="…" inside
// another attribute's value (an alt or title) is left alone.
const ATTR = /(\s+)([^\s"'>\/=]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
function withWidth(attrs, w) {
  let found = false;
  const out = attrs.replace(ATTR, (m, sp, name, eq, val) => {
    if (found || val === undefined || name.toLowerCase() !== 'style') return m;
    found = true;
    const q = val[0] === '"' || val[0] === "'" ? val[0] : '"';
    const css = val[0] === q ? val.slice(1, -1) : val;
    return `${sp}${name}${eq}${q}width:${w}px;${css}${q}`;
  });
  return found ? out : null;
}
const map = []; const index = new Map(); let missing = 0;
html = html.replace(/<img\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/g, (m, a, s, b) => {
  if (!local(s)) return m;
  const file = path.join(dir, s);
  if (!fs.existsSync(file)) { console.error(`  ✗ image not found: ${s}`); missing++; return m; }
  if (!index.has(file)) {
    const mime = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    index.set(file, map.length);
    map.push(`data:${mime};base64,${fs.readFileSync(file).toString('base64')}`);
  }
  // @2x images (annotate.mjs output) display at half their pixel size, so they stay sharp
  // and at the size they were cropped to. data-src keeps the name for check-deliverable.
  let size = '';
  if (/@2x\.(png|jpe?g)$/i.test(s) && !/\bwidth=/.test(a + b)) {
    const d = dims(fs.readFileSync(file));
    // Inline width: base.css sets width:auto on figure images, which would override the
    // width attribute and show a 2x crop at double size.
    if (d) {
      const w = Math.round(d[0] / 2);
      size = ` width="${w}" height="${Math.round(d[1] / 2)}"`;
      // A tag can carry only one style attribute (the browser ignores a second one), so the
      // width goes at the start of the tag's own style when it has one; the tag's own
      // declarations come after it and still apply.
      const inA = withWidth(a, w); const inB = inA === null ? withWidth(b, w) : null;
      if (inA !== null) a = inA;
      else if (inB !== null) b = inB;
      else size += ` style="width:${w}px"`;
    }
  }
  return `<img${a}data-img="${index.get(file)}" data-src="${s}"${size}${b}>`;
});
if (map.length) {
  const js = `<script>window.__IMG=${JSON.stringify(Object.fromEntries(map.map((v, i) => [i, v])))};</script>`;
  html = html.replace(/<script>\n?\/\* Shared behaviour/, (m) => js + '\n' + m);
  if (!html.includes('window.__IMG=')) html = html.replace('</body>', js + '\n</body>');
}

const namesArg = rest[rest.indexOf('--names') + 1];
if (rest.includes('--names') && namesArg) {
  for (const pair of namesArg.split(',')) {
    const [k, v] = pair.split('=');
    html = html.replace(new RegExp(`href="${k}\\.html(#[^"]*)?"`, 'g'), (m, h) => `href="${v}${h || ''}"`);
  }
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, html);
const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`${out}: ${kb} KB, ${map.length} image(s) embedded${missing ? `, ${missing} missing` : ''}`);
process.exit(missing ? 1 : 0);
