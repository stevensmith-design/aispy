// Runs inside the page. Returns { structure, tokens, ja }.
// Used by capture.mjs, and can be pasted into a browser console for manual capture
// (it then copies the JSON to the clipboard when `copy` exists).
(() => {
  const JA = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
  // Visible to sighted users: excludes screen-reader-only text (clip / clip-path / 1px boxes),
  // which otherwise inflates colour and size counts with browser defaults such as #0000EE.
  const srOnly = (s, r) => (s.clip && s.clip !== 'auto' && /rect\(0(px)?,? ?0(px)?,? ?0(px)?,? ?0(px)?\)/.test(s.clip.replace(/\s+/g, ' ')))
    || /inset\(50%\)|circle\(0/.test(s.clipPath || '') || (r.width <= 1 && r.height <= 1);
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !srOnly(s, r);
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const name = (el) => el.getAttribute('aria-label') || txt(el) || el.getAttribute('title') || (el.querySelector('img') && el.querySelector('img').alt) || '';

  const structure = {
    url: location.href,
    title: document.title,
    lang: document.documentElement.lang || null,
    viewport: innerWidth,
    pageHeight: document.documentElement.scrollHeight,
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ level: +h.tagName[1], text: txt(h), visible: vis(h), ...box(h) })),
    landmarks: [...document.querySelectorAll('header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=contentinfo]')].map((l) => ({ tag: l.tagName.toLowerCase(), role: l.getAttribute('role'), label: l.getAttribute('aria-label'), ...box(l) })),
    links: [...document.querySelectorAll('a[href]')].map((a) => ({ text: name(a), href: a.href, external: a.host !== location.host, visible: vis(a), ...box(a) })),
    buttons: [...document.querySelectorAll('button,[role=button],input[type=submit],input[type=button]')].map((b) => ({ text: name(b), visible: vis(b), disabled: !!b.disabled, ...box(b) })),
    fields: [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].map((f) => ({ type: f.type || f.tagName.toLowerCase(), name: f.name, label: (f.labels && f.labels[0] && txt(f.labels[0])) || f.getAttribute('aria-label') || f.placeholder || '', ...box(f) })),
    imagesNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt') && vis(i)).map((i) => ({ src: i.currentSrc.slice(0, 200), ...box(i) })),
    linksNoName: [...document.querySelectorAll('a[href],button')].filter((a) => vis(a) && !name(a)).map((a) => ({ tag: a.tagName.toLowerCase(), href: a.href || null, ...box(a) })),
    smallTargets: [...document.querySelectorAll('a[href],button,[role=button],input,select')].filter(vis).map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ r }) => r.width < 24 || r.height < 24).slice(0, 200).map(({ e }) => ({ text: name(e).slice(0, 60), ...box(e) })),
    fixed: [...document.querySelectorAll('body *')].filter((e) => { const p = getComputedStyle(e).position; return (p === 'fixed' || p === 'sticky') && vis(e); }).slice(0, 50).map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 80), position: getComputedStyle(e).position, text: txt(e).slice(0, 80), ...box(e) })),
  };

  // Page map: top-level content sections in page order, with position and length in screens,
  // so IA, flow review and the mock can talk about "screen 7" without re-measuring.
  const sectionEls = (() => {
    const shop = [...document.querySelectorAll('[id^="shopify-section-"]')].filter((e) => !e.parentElement.closest('[id^="shopify-section-"]'));
    if (shop.length > 2) return shop;
    const main = document.querySelector('main') || document.body;
    const kids = [...main.children].filter((e) => e.getBoundingClientRect().height > 40);
    const secs = [...document.querySelectorAll('section')].filter((e) => !e.parentElement.closest('section'));
    return secs.length > 2 ? secs : kids;
  })();
  structure.sections = sectionEls.filter(vis).map((e, i) => {
    const r = e.getBoundingClientRect(); const y = Math.round(r.top + scrollY);
    const h = e.querySelector('h1,h2,h3,[class*="title" i],[class*="heading" i]');
    return { i: i + 1, heading: h ? txt(h).slice(0, 60) : '', id: (e.id || '').replace(/^shopify-section-(template--\d+__)?/, '').slice(0, 40), y, h: Math.round(r.height), screen: +(y / innerHeight + 1).toFixed(1), screens: +(r.height / innerHeight).toFixed(1) };
  });

  const freq = {};
  const bump = (k, v) => { if (!v) return; freq[k] = freq[k] || {}; freq[k][v] = (freq[k][v] || 0) + 1; };
  const ja = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const s = getComputedStyle(el);
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    bump('background', s.backgroundColor !== 'rgba(0, 0, 0, 0)' ? s.backgroundColor : null);
    bump('radius', s.borderRadius !== '0px' ? s.borderRadius : null);
    if (own) {
      bump('color', s.color);
      bump('fontFamily', s.fontFamily);
      bump('fontSize', s.fontSize);
      bump('fontWeight', s.fontWeight);
      bump('lineHeight', s.lineHeight);
      bump('letterSpacing', s.letterSpacing);
      const t = txt(el);
      if (JA.test(t) && ja.length < 400) {
        ja.push({ tag: el.tagName.toLowerCase(), text: t.slice(0, 40), fontFamily: s.fontFamily, fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, wordBreak: s.wordBreak, lang: el.closest('[lang]') ? el.closest('[lang]').getAttribute('lang') : null, ...box(el) });
      }
    }
  }
  // Theme CSS custom properties (e.g. Shopify colour schemes): often the clearest statement of intent.
  const rootVars = {};
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules || []) {
      if (!r.style || !/^(:root|html|body|\.color-scheme|\.scheme|\[data-theme)/.test(r.selectorText || '')) continue;
      for (const prop of r.style) if (prop.startsWith('--')) rootVars[`${r.selectorText} ${prop}`] = r.style.getPropertyValue(prop).trim();
    }
  }
  const sorted = Object.fromEntries(Object.entries(freq).map(([k, m]) => [k, Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 40)]));
  sorted.cssVariables = Object.entries(rootVars).slice(0, 600);
  const out = { structure, tokens: sorted, ja };
  if (typeof copy === 'function') copy(JSON.stringify(out));
  return out;
})();
