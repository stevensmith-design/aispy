import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCapturePages } from '../input.mjs';

test('implicit output names include the host and path', () => {
  assert.deepEqual(
    parseCapturePages('https://example.com/products?id=1#details\n'),
    [{ name: 'example-com-products', url: 'https://example.com/products?id=1#details' }],
  );
});

test('implicit output names distinguish URLs with the same path', () => {
  assert.deepEqual(
    parseCapturePages('https://one.example/item\nhttps://two.example/item\n').map(({ name }) => name),
    ['one-example-item', 'two-example-item'],
  );
});

test('duplicate output names fail before capture', () => {
  assert.throws(
    () => parseCapturePages('same\thttps://one.example/item\nsame\thttps://two.example/item\n'),
    /Duplicate capture output name\(s\): same/,
  );
});

test('query variants require explicit names instead of exposing query values', () => {
  assert.throws(
    () => parseCapturePages('https://example.com/item?id=1\nhttps://example.com/item?id=2\n'),
    /Duplicate capture output name\(s\): example-com-item/,
  );
});

test('comments and blank lines are ignored', () => {
  assert.deepEqual(
    parseCapturePages('\n# review scope\nlanding\thttps://example.com\n'),
    [{ name: 'landing', url: 'https://example.com' }],
  );
});
