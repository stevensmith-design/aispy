// Forbidden-name matching for check-deliverable.mjs (--forbid). No dependencies.
//
// Latin terms match as whole words, case-insensitive (\b on both sides).
// Japanese terms match as substrings: \b only knows ASCII word characters, so a \b-wrapped
// Japanese term can never match. A term written only in katakana counts only when it is not
// part of a longer katakana run, so a short name doesn't flag every longer word containing it.

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const KATA = 'ァ-ヶー';
const JAPANESE = /[　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/u;
const KATA_ONLY = new RegExp(`^[${KATA}]+$`, 'u');

export function forbidPattern(term) {
  const t = term.trim();
  if (KATA_ONLY.test(t)) return new RegExp(`(?<![${KATA}])${esc(t)}(?![${KATA}])`, 'u');
  if (JAPANESE.test(t)) return new RegExp(esc(t), 'iu');
  return new RegExp(`\\b${esc(t)}\\b`, 'i');
}

// Returns the terms from `terms` that appear in `text`.
export function forbiddenHits(text, terms) {
  return terms.map((x) => x.trim()).filter(Boolean).filter((t) => forbidPattern(t).test(text));
}
