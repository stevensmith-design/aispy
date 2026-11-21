import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { writeCaptureNotes } from '../notes.mjs';

const tmpFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aispy-notes-')), 'capture-notes.md');

test('the first run writes the notes as before', () => {
  const file = tmpFile();
  writeCaptureNotes(file, ['# Capture log A', '', '- **en-top @ 390** https://example.com/: ok']);
  assert.equal(fs.readFileSync(file, 'utf8'), '# Capture log A\n\n- **en-top @ 390** https://example.com/: ok\n');
});

test('a second run into the same folder keeps the first run\'s notes', () => {
  const file = tmpFile();
  writeCaptureNotes(file, ['# Capture log A', '', '- **en-top @ 390** https://example.com/: ERROR timeout']);
  writeCaptureNotes(file, ['# Capture log B', '', '- **ja-top @ 390** https://example.com/ja/: ok']);
  assert.equal(
    fs.readFileSync(file, 'utf8'),
    '# Capture log A\n\n- **en-top @ 390** https://example.com/: ERROR timeout\n'
    + '\n# Capture log B\n\n- **ja-top @ 390** https://example.com/ja/: ok\n',
  );
});

test('an empty notes file is written over, not appended to', () => {
  const file = tmpFile();
  fs.writeFileSync(file, '');
  writeCaptureNotes(file, ['# Capture log A', '']);
  assert.equal(fs.readFileSync(file, 'utf8'), '# Capture log A\n\n');
});
