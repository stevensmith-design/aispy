// Runs inside the page. Lists every control that hides content until opened, so the interaction
// sweep can open each one and log what it contains (sweep.md). It does not open anything
// itself: opening is done in the browser so content that loads on demand is seen.
// Paste into a browser console or run through a javascript tool; returns an array.
(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || el.title || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const pos = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const seen = new Set(); const out = [];
  const add = (kind, el, extra = {}) => { if (seen.has(el) || !vis(el)) return; seen.add(el); out.push({ kind, text: txt(el), ...pos(el), ...extra }); };
  document.querySelectorAll('details > summary').forEach((e) => add('accordion', e));
  document.querySelectorAll('[aria-expanded]').forEach((e) => add(e.getAttribute('aria-haspopup') ? 'menu/popup' : 'expander', e, { expanded: e.getAttribute('aria-expanded') }));
  document.querySelectorAll('[aria-haspopup], [aria-controls]').forEach((e) => add('popup trigger', e));
  document.querySelectorAll('[role=tab]').forEach((e) => add('tab', e));
  document.querySelectorAll('button, [role=button], a[href^="#"]').forEach((e) => {
    const t = txt(e);
    if (/^[ⓘi?]$|info|詳細|詳しく|もっと見る|すべて見る|開く|show|more|filter|絞り込|並び替え|sort/i.test(t)) add('info/more/filter', e);
  });
  document.querySelectorAll('select').forEach((e) => add('select', e, { options: [...e.options].map((o) => o.text.trim()).slice(0, 20) }));
  document.querySelectorAll('input[type=radio], input[type=checkbox]').forEach((e) => { const l = e.labels && e.labels[0]; if (l) add('option', l, { name: e.name }); });
  // Variant/type links: options rendered as links to other product URLs.
  document.querySelectorAll('a[href*="/products/"]').forEach((a) => {
    if (a.closest('fieldset, [class*=variant], [class*=option], [class*=type], [class*=swatch]')) add('variant link (navigates?)', a, { href: a.href });
  });
  document.querySelectorAll('dialog, [role=dialog], [aria-modal=true]').forEach((e) => out.push({ kind: 'dialog in DOM', text: txt(e), open: vis(e) }));
  const footer = document.querySelector('footer'); if (footer) out.push({ kind: 'footer (read fully)', text: txt(footer).slice(0, 80), ...pos(footer) });
  return out.sort((a, b) => (a.y || 0) - (b.y || 0));
})();
