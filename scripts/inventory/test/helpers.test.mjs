import assert from 'node:assert/strict';
import test from 'node:test';

import { getUrl, isSoft404, pageText } from '../helpers.mjs';

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
