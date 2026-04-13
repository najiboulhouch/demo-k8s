import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const CORPUS_DIR = path.join(process.cwd(), 'rag', 'corpus');
const EXT = ['.md', '.txt'];

let cache = null;

/**
 * @returns {Promise<{ id: string, source: string, text: string }[]>}
 */
export async function loadCorpusChunks() {
  if (cache) return cache;

  const files = await readdir(CORPUS_DIR).catch(() => []);
  const chunks = [];

  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (!EXT.includes(ext)) continue;
    const full = path.join(CORPUS_DIR, name);
    const raw = await readFile(full, 'utf8');
    const source = path.relative(process.cwd(), full).replace(/\\/g, '/');
    const parts = splitIntoChunks(raw, 900);
    parts.forEach((text, i) => {
      chunks.push({
        id: `${source}#${i}`,
        source,
        text: text.trim(),
      });
    });
  }

  cache = chunks;
  return cache;
}

export function clearCorpusCache() {
  cache = null;
}

function splitIntoChunks(text, maxLen) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const paras = normalized.split(/\n\n+/);
  const out = [];
  let buf = '';
  for (const p of paras) {
    const piece = p.trim();
    if (!piece) continue;
    if ((buf + '\n\n' + piece).length > maxLen && buf) {
      out.push(buf);
      buf = piece;
    } else {
      buf = buf ? `${buf}\n\n${piece}` : piece;
    }
  }
  if (buf) out.push(buf);
  if (out.length === 0) return [normalized];
  return out;
}
