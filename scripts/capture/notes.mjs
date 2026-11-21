import fs from 'node:fs';

// Write one run's capture log. If the file already has notes from an earlier run into the same
// folder (for example English pages, then Japanese), add this run after them instead of
// replacing them. Each run starts with its own "# Capture log <time>" heading.
export function writeCaptureNotes(file, lines) {
  const text = lines.join('\n') + '\n';
  if (fs.existsSync(file) && fs.statSync(file).size > 0) fs.appendFileSync(file, '\n' + text);
  else fs.writeFileSync(file, text);
}
