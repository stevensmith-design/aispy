import assert from 'node:assert/strict';
import test from 'node:test';

import { getUrl, isOffsiteRedirect, isSoft404, pageText, uniqueFinalPages } from '../helpers.mjs';

function fakeFetch(routes) {
  return async (url) => {
    const route = routes[url];
    if (!route) throw new Error(`unexpected URL: ${url}`);
    return new Response(route.body || '', {
      status: route.status,
      headers: route.location ? { location: route.location } : {},
    });
  };
}

test('follows relative redirects and returns the final page', async () => {
  const result = await getUrl('https://example.com/old', {
    fetchImpl: fakeFetch({
      'https://example.com/old': { status: 301, location: '/new' },
      'https://example.com/new': { status: 200, body: '<h1>New page</h1>' },
    }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.finalUrl, 'https://example.com/new');
  assert.deepEqual(result.redirects, ['https://example.com/new']);
  assert.equal(result.body, '<h1>New page</h1>');
});

test('reports redirect loops', async () => {
  const result = await getUrl('https://example.com/a', {
    fetchImpl: fakeFetch({
      'https://example.com/a': { status: 302, location: '/b' },
      'https://example.com/b': { status: 302, location: '/a' },
    }),
  });
  assert.equal(result.status, 0);
  assert.equal(result.error, 'redirect loop');
  assert.deepEqual(result.redirects, ['https://example.com/b', 'https://example.com/a']);
});

test('stops redirect chains at the configured limit', async () => {
  const result = await getUrl('https://example.com/1', {
    maxRedirects: 2,
    fetchImpl: fakeFetch({
      'https://example.com/1': { status: 302, location: '/2' },
      'https://example.com/2': { status: 302, location: '/3' },
      'https://example.com/3': { status: 302, location: '/4' },
    }),
  });
  assert.equal(result.status, 0);
  assert.equal(result.error, 'redirect limit (2)');
  assert.deepEqual(result.redirects, [
    'https://example.com/2',
    'https://example.com/3',
    'https://example.com/4',
  ]);
});

test('cancels unused redirect and non-200 response bodies', async () => {
  let cancellations = 0;
  const fetchImpl = async (url) => ({
    status: url.endsWith('/old') ? 302 : 404,
    headers: { get: (name) => (name === 'location' && url.endsWith('/old') ? '/missing' : null) },
    body: { cancel: async () => { cancellations++; } },
    text: async () => '',
  });
  const result = await getUrl('https://example.com/old', { fetchImpl });
  assert.equal(result.status, 404);
  assert.equal(cancellations, 2);
});

test('detects soft 404 text in the title, h1 or body', () => {
  for (const html of [
    '<title>404</title><body>Try again</body>',
    '<title>Store</title><body><h1>Page not found</h1></body>',
    '<title>ストア</title><body><main>ページが見つかりません</main></body>',
  ]) {
    assert.equal(isSoft404(pageText(html)), true);
  }
});

test('ignores not-found text inside scripts and styles', () => {
  const html = '<title>Store</title><body><script>const message = "not found";</script><style>.not-found{}</style><h1>Welcome</h1></body>';
  assert.equal(isSoft404(pageText(html)), false);
});

test('does not flag prices, SKUs or FAQ copy as soft 404s', () => {
  for (const html of [
    '<title>Store</title><body><h1>Tee</h1><p>¥1,404 (tax incl.)</p></body>',
    '<title>Store</title><body><h1>Model</h1><p>SKU 404-BLK</p></body>',
    '<title>Store</title><body><h1>FAQ</h1><p>If your order number is not found, contact us.</p></body>',
  ]) {
    assert.equal(isSoft404(pageText(html)), false);
  }
});

test('does not flag a Japanese product page with generic footer help', () => {
  const html = '<title>商品</title><body><h1>商品名</h1><footer>お探しのページが見つからない場合は、サイトマップをご覧ください。</footer></body>';
  assert.equal(isSoft404(pageText(html)), false);
});

test('detects a complete Japanese not-found phrase in body text', () => {
  const html = '<title>ストア</title><body><main>お探しのページは見つかりませんでした。</main></body>';
  assert.equal(isSoft404(pageText(html)), true);
});

test('identifies redirects whose final target is on another host', () => {
  assert.equal(isOffsiteRedirect(
    'https://shop.example.com',
    'https://accounts.example.com/sign-in',
    ['https://accounts.example.com/sign-in'],
  ), true);
  assert.equal(isOffsiteRedirect(
    'https://shop.example.com',
    'https://shop.example.com/new',
    ['https://shop.example.com/new'],
  ), false);
  assert.equal(isOffsiteRedirect(
    'https://shop.example.com',
    'https://accounts.example.com/sign-in',
    [],
  ), false);
});

test('deduplicates groups by final URL and prefers the canonical row', () => {
  const rows = [
    {
      url: 'https://example.com/products/deleted',
      finalUrl: 'https://example.com/',
      location: 'https://example.com/',
      title: 'Home',
    },
    {
      url: 'https://example.com/',
      finalUrl: 'https://example.com/',
      location: '',
      title: 'Home',
    },
  ];
  assert.deepEqual(uniqueFinalPages(rows), [rows[1]]);
});

test('uses the final URL as representative when only a redirect row exists', () => {
  assert.deepEqual(uniqueFinalPages([{
    url: 'https://example.com/old',
    finalUrl: 'https://example.com/new',
    location: 'https://example.com/new',
  }]), [{
    url: 'https://example.com/new',
    finalUrl: 'https://example.com/new',
    location: 'https://example.com/new',
  }]);
});
