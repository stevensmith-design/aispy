function slug(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function nameFromUrl(value) {
  const url = new URL(value);
  const host = slug(url.host);
  const pathname = slug(url.pathname) || 'top';
  return `${host}-${pathname}`;
}

export function parseCapturePages(contents) {
  const pages = contents.split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      if (!line.includes('\t')) return { name: nameFromUrl(line), url: line };
      const separator = line.indexOf('\t');
      return {
        name: line.slice(0, separator).trim(),
        url: line.slice(separator + 1).trim(),
      };
    });

  const counts = new Map();
  for (const { name } of pages) {
    const key = name.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const duplicates = [...counts]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
  if (duplicates.length) {
    throw new Error(
      `Duplicate capture output name(s): ${duplicates.join(', ')}. `
      + 'Give each URL a unique tab-separated name.',
    );
  }

  return pages;
}
