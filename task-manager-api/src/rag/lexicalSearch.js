const STOP = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'a', 'en', 'pour', 'par', 'sur',
  'dans', 'ce', 'cette', 'ces', 'est', 'son', 'sa', 'ses', 'que', 'qui', 'quoi', 'dont', 'avec', 'sans',
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'as', 'at', 'by',
]);

function tokenize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9àâäéèêëïîôùûüç]+/iu)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * @param {string} query
 * @param {{ id: string, source: string, text: string }[]} chunks
 * @param {number} k
 */
export function lexicalTopK(query, chunks, k) {
  const qTerms = tokenize(query);
  if (qTerms.length === 0) {
    return chunks.slice(0, k).map((c, i) => ({ ...c, score: 1 - i * 0.01 }));
  }

  const df = new Map();
  for (const term of qTerms) {
    let d = 0;
    for (const c of chunks) {
      const t = tokenize(c.text);
      const set = new Set(t);
      if (set.has(term)) d++;
    }
    df.set(term, d);
  }

  const n = Math.max(1, chunks.length);
  const scored = chunks.map((c) => {
    const t = tokenize(c.text);
    const freq = new Map();
    for (const w of t) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    let score = 0;
    for (const term of qTerms) {
      const f = freq.get(term) ?? 0;
      if (f === 0) continue;
      const idf = Math.log(1 + n / (1 + (df.get(term) ?? 0)));
      score += (1 + Math.log(f)) * idf;
    }
    return { chunk: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const positive = scored.filter((x) => x.score > 0);
  const chosen = positive.length > 0 ? positive : scored;
  return chosen.slice(0, k).map((x) => ({ ...x.chunk, score: x.score }));
}
