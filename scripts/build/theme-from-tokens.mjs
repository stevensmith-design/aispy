#!/usr/bin/env node
// Map the extracted design system (03-system/tokens.json) onto the templates' theme variables.
// Usage: node theme-from-tokens.mjs 03-system/tokens.json > 07-deliverables/src/theme.css
// Token files differ per extraction (color.textSecondary, color.text.muted, color.neutral500…),
// so each theme variable has an ordered list of name patterns. The first match wins and its
// token path is written beside the value. No match: the template default, marked "default".
// Where a brand colour fails 4.5:1 with white text, a darker shade of it is derived and marked
// "derived from <token>". Read the stderr report, then fix by hand any mapping that is wrong
// for this brand (say, a sale red picked as --issue when the brand's error colour is better).
import fs from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node theme-from-tokens.mjs tokens.json > theme.css'); process.exit(2); }
const T = JSON.parse(fs.readFileSync(file, 'utf8'));
const flat = [];
(function walk(o, p) {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    if ('$value' in o || 'value' in o) { flat.push([p, o.$value ?? o.value]); return; }
    for (const [k, v] of Object.entries(o)) if (!/^[_$]?(meta|note|purpose)/i.test(k) && !/(_note|Purpose|Note)$/.test(k)) walk(v, p ? `${p}.${k}` : k);
  } else flat.push([p, o]);
})(T, '');
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const colours = flat.filter(([, v]) => typeof v === 'string' && HEX.test(v.trim()));
const find = (pats, pool = colours) => {
  for (const re of pats) { const hit = pool.find(([p]) => re.test(p)); if (hit) return hit; }
  return null;
};
const lum = (hex) => {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const darken = (hex, f) => '#' + hex.replace('#', '').match(/../g).map((c) => Math.round(parseInt(c, 16) * f).toString(16).padStart(2, '0')).join('').toUpperCase();
const full = (hex) => (hex.length === 4 ? '#' + hex.slice(1).split('').map((c) => c + c).join('') : hex).toUpperCase();

// Ordered patterns per variable. Paths are matched case-insensitively against the full token path.
const MAP = {
  canvas: [/color.*\b(canvas|background|bg)$/i, /ground\.bg$/i, /neutral(ramp)?\.?0$/i],
  surface: [/color.*\bsurface$/i, /ground\.bg$/i, /neutral(ramp)?\.?0$/i, /\bcard$/i],
  sand: [/surface.?sand/i, /neutral.?200$|neutral(ramp)?\.3$/i, /surface.?alt/i],
  tint: [/surface.?tint/i, /selected.?fill|selection\.selected$/i, /neutral.?100$|neutral(ramp)?\.2$/i, /surface.?alt/i],
  border: [/color.*\bborder$/i, /ground\.border$/i, /neutral.?200$/i],
  'border-strong': [/border.?strong/i, /neutral.?300$|neutral(ramp)?\.4$/i, /disabled$/i],
  text: [/text.?primary$|text\.primary$/i, /color\.text$/i, /neutral.?900$|neutral(ramp)?\.9$/i],
  'text-2': [/text.?secondary$/i, /text.?muted$|text\.muted$/i, /neutral.?500$|neutral(ramp)?\.5$/i],
  brand: [/brand.?dark$/i, /color.*\bbrand$/i, /semantic\.primary$|color\.primary$/i],
  deep: [/primary.?deep$/i, /brand.?dark$/i, /primary.?hover$/i, /neutral.?700$|neutral(ramp)?\.7$/i, /semantic\.primary$|color\.primary$/i],
  primary: [/semantic\.primary$|color\.primary$/i, /secondary$/i, /link$/i],
  issue: [/\berror$/i, /destructive$/i, /\bsale$/i, /accent$/i],
  warn: [/warning$/i],
  good: [/success$/i],
  'role-decide': null, 'role-reassure': null, 'role-persuade': null, 'role-sell': null, 'role-navigate': null,
};
const DEFAULTS = { canvas: '#F5F4F0', surface: '#FFFFFF', sand: '#E5E2D9', tint: '#ECEFF1', border: '#DDDAD2', 'border-strong': '#C6C2B6', text: '#1D2024', 'text-2': '#5A5F66', brand: '#2F4A5E', deep: '#243A4B', primary: '#46667D', issue: '#B9352C', warn: '#8A5A00', good: '#2C6B47' };
const out = {}; const src = {}; const report = [];
for (const [k, pats] of Object.entries(MAP)) {
  if (!pats) continue;
  const hit = find(pats);
  if (hit) { out[k] = full(hit[1].trim()); src[k] = hit[0]; } else { out[k] = DEFAULTS[k]; src[k] = 'default (no matching token)'; report.push(`--${k}: no token matched; template default used`); }
}
// White text must read on brand, deep and issue; text-2 on canvas and surface.
for (const k of ['brand', 'deep', 'issue', 'good']) {
  let v = out[k]; let n = 0;
  while (ratio('#FFFFFF', v) < 4.5 && n < 20) { v = darken(v, 0.9); n++; }
  if (n) { report.push(`--${k}: ${out[k]} fails 4.5:1 with white; derived ${v}`); src[k] = `derived from ${src[k]} (darkened for contrast)`; out[k] = v; }
}
for (const bg of ['canvas', 'surface']) {
  let v = out['text-2']; let n = 0;
  while (ratio(v, out[bg]) < 4.5 && n < 20) { v = darken(v, 0.9); n++; }
  if (n) { report.push(`--text-2: ${out['text-2']} fails 4.5:1 on ${bg}; derived ${v}`); src['text-2'] = `derived from ${src['text-2']} (darkened for contrast)`; out['text-2'] = v; }
}
if (out.brand === out.text && out.deep === out.text) report.push('--brand and --deep are the body text colour: the brand is monochrome. Fine, but check the cover reads as the brand.');
const tint = (hex, a) => '#' + hex.replace('#', '').match(/../g).map((c) => Math.round(parseInt(c, 16) * a + 255 * (1 - a)).toString(16).padStart(2, '0')).join('').toUpperCase();
const issueBg = tint(out.issue, 0.1); const goodBg = tint(out.good, 0.1);
// Roles for the page-layout bars. Five hues a reader can tell apart at a glance, all from the
// brand, in the spirit of the reference review: decide = the brand's main colour (mid-tone),
// reassure = a soft green, persuade = a warm brand-tinted sand, sell = the sale or accent colour
// softened, navigate = a light neutral. Only decide carries white text; the rest carry dark text.
const rgb = (h) => full(h).slice(1).match(/../g).map((c) => parseInt(c, 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a, b, t) => hex(rgb(a).map((v, i) => v * (1 - t) + rgb(b)[i] * t));
const dist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
const saleTok = find([/\bsale$/i, /accent$/i, /error$/i]);
const warmTok = find([/promo/i, /badge.?fill/i, /accent$/i, /highlight/i]);
let decide = out.primary; if (lum(decide) < 0.04) decide = mix(decide, '#FFFFFF', 0.3);
if (ratio('#FFFFFF', decide) < 4.5) decide = out.deep;
const roles = {
  'role-decide': [decide, decide === out.primary ? 'primary' : 'deep'],
  'role-reassure': [mix(out.good, '#FFFFFF', 0.45), 'good, lightened'],
  'role-persuade': warmTok && (!saleTok || warmTok[0] !== saleTok[0]) ? [mix(full(warmTok[1]), out.primary, 0.2), `${warmTok[0]} with primary`] : [mix(out.sand, '#B08A4E', 0.4), 'sand, warmed'],
  'role-sell': saleTok ? [mix(full(saleTok[1]), '#FFFFFF', 0.4), `${saleTok[0]}, lightened`] : ['#E7A27E', 'default'],
  'role-navigate': [out['border-strong'], 'border-strong'],
};
for (const k of ['role-persuade', 'role-sell', 'role-reassure']) {
  let n = 0; while (ratio(out.text, roles[k][0]) < 4.5 && n < 10) { roles[k][0] = mix(roles[k][0], '#FFFFFF', 0.15); n++; }
}
// Keep every pair apart: nudge persuade and sell until each differs from the others.
const keys = Object.keys(roles);
for (const k of ['role-persuade', 'role-sell', 'role-reassure']) {
  let n = 0;
  while (keys.some((o) => o !== k && dist(roles[k][0], roles[o][0]) < 60) && n < 12) {
    roles[k][0] = k === 'role-reassure' ? mix(roles[k][0], out.good, 0.25) : mix(roles[k][0], k === 'role-sell' ? '#D9572B' : '#C9A35A', 0.25);
    roles[k][1] += n ? '' : ' (adjusted to stay distinct)'; n++;
  }
}
const close = [];
for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) if (dist(roles[keys[i]][0], roles[keys[j]][0]) < 60) close.push(`${keys[i]}/${keys[j]}`);
if (close.length) report.push(`role colours close together: ${close.join(', ')}; pick by hand`);
const fam = flat.find(([p, v]) => typeof v === 'string' && /(font.?family|type\.family)(\.body|\.jp)?$|fontFamily\.body$/i.test(p) && !/note/i.test(p));
const head = flat.find(([p, v]) => typeof v === 'string' && /(family|fontFamily)\.(display|heading)$/i.test(p));
const JA = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic UI",Meiryo,sans-serif';
const q = (s) => s.split(',').map((x) => x.trim()).filter((x) => x && !/^sans-serif$/i.test(x)).map((x) => (/^["']/.test(x) || !/\s/.test(x) ? x : `"${x}"`)).join(',');
const dedupe = (list) => [...new Set(list.split(',').map((x) => x.trim().replace(/^'|'$/g, '"')).map((x) => (x.startsWith('"') ? x : x)))].join(',');
const body = dedupe(fam ? `${q(fam[1])},${JA}` : `system-ui,${JA}`);
const radius = (n) => { const h = flat.find(([p]) => new RegExp(`radius\\.${n}$`, 'i').test(p)); return h ? [h[1], h[0]] : null; };
const r = { sm: radius('sm'), md: radius('md'), lg: radius('lg') || radius('md'), pill: radius('pill') || radius('full') };
if (!fam) report.push('--font-body: no body font family token; system fonts used');

const line = (k, v, s) => `  --${k}:${v};${' '.repeat(Math.max(1, 26 - k.length - v.length))}/* ${s} */`;
const css = [
  `/* THEME LAYER, generated by theme-from-tokens.mjs from ${file} on ${new Date().toISOString().slice(0, 10)}.`,
  '   Each value names its source token. Review the mapping before use; edit by hand where a',
  '   different token suits the role better, and keep the comment true. */',
  ':root{',
  ...['canvas', 'surface', 'sand', 'tint', 'border', 'border-strong', 'text', 'text-2', 'brand', 'deep', 'primary'].map((k) => line(k, out[k], src[k])),
  line('issue', out.issue, src.issue), line('issue-bg', issueBg, 'issue at 10%'),
  line('warn', out.warn, src.warn),
  line('good', out.good, src.good), line('good-bg', goodBg, 'good at 10%'),
  ...Object.entries(roles).map(([k, [v, s]]) => line(k, v, s)),
  `  --font-body:${body}; /* ${fam ? fam[0] : 'default'} + market fallbacks */`,
  `  --font-head:${head ? dedupe(`${q(head[1])},${body}`) : 'var(--font-body)'}; /* ${head ? head[0] : 'same as body'} */`,
  '  --tracking:.02em; --tracking-ja:.04em; /* document reading values, not the site\'s */',
  `  --r-sm:${r.sm ? r.sm[0] : '8px'}; --r-md:${r.md ? r.md[0] : '12px'}; --r-lg:${r.lg ? r.lg[0] : '16px'}; --pill:${r.pill ? r.pill[0] : '100px'}; /* ${['sm', 'md', 'lg', 'pill'].map((n) => (r[n] ? r[n][1] : `${n}: default`)).join(', ')} */`,
  '  --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px; --s7:48px; --s8:64px;',
  '}',
].join('\n');
console.log(css);
console.error(report.length ? `Mapping notes:\n- ${report.join('\n- ')}` : 'Mapping notes: every variable matched a token.');
