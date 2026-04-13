import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cosineSimilarity } from './cosine.js';
import { embedTexts } from './embeddingApi.js';
import { embeddingModel } from '../openrouterClient.js';

const INDEX_PATH = path.join(process.cwd(), 'data', 'rag-embeddings.json');

let indexCache = null;

export function getIndexPath() {
  return INDEX_PATH;
}

export async function loadEmbeddingIndex() {
  if (indexCache) return indexCache;
  try {
    const raw = await readFile(INDEX_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data?.chunks || !Array.isArray(data.chunks)) return null;
    indexCache = data;
    return data;
  } catch {
    return null;
  }
}

export function clearEmbeddingIndexCache() {
  indexCache = null;
}

/**
 * @param {import('openai').OpenAI} client
 * @param {string} question
 * @param {number} k
 */
export async function embeddingTopK(client, question, k) {
  const index = await loadEmbeddingIndex();
  if (!index?.chunks?.length) return null;

  const model = index.model || embeddingModel();
  const [qVec] = await embedTexts(client, model, [question.trim()]);
  if (!qVec) return null;

  const scored = index.chunks.map((c) => ({
    id: c.id,
    source: c.source,
    text: c.text,
    score: cosineSimilarity(qVec, c.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
