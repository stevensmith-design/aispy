const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);

export async function getUrl(url, { fetchImpl = fetch, headers = {}, maxRedirects = 10 } = {}) {
  let current = url;
  const seen = new Set([current]);
  const redirects = [];

  while (true) {
    try {
      const response = await fetchImpl(current, { headers, redirect: 'manual' });
      const location = response.headers.get('location');
      if (REDIRECT_STATUS.has(response.status) && location) {
        const next = new URL(location, current).href;
        if (seen.has(next)) {
          return {
            status: 0,
            error: 'redirect loop',
            body: '',
            finalUrl: current,
            redirects: [...redirects, next],
          };
        }
        if (redirects.length >= maxRedirects) {
          return {
            status: 0,
            error: `redirect limit (${maxRedirects})`,
            body: '',
            finalUrl: current,
            redirects: [...redirects, next],
          };
        }
        redirects.push(next);
        seen.add(next);
        current = next;
        continue;
      }

      return {
        status: response.status,
        error: '',
        body: response.status === 200 ? await response.text() : '',
        finalUrl: current,
        redirects,
      };
    } catch (error) {
      return {
        status: 0,
        error: error.message,
        body: '',
        finalUrl: current,
        redirects,
      };
    }
  }
}

function text(value) {
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pageText(html) {
  const title = text((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => text(match[1]))
    .join(' ');
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || html;
  return { title, h1, body: text(body) };
}

export function isSoft404({ title = '', h1 = '', body = '' }) {
  return /\b404\b|\bnot found\b|ページが見つかりません/i.test(`${title} ${h1} ${body}`);
}
