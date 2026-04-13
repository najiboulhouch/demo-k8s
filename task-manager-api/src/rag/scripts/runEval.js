import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createOpenRouterClient } from '../../openrouterClient.js';
import { clearCorpusCache, loadCorpusChunks } from '../loadCorpus.js';
import { lexicalTopK } from '../lexicalSearch.js';
import {
  clearEmbeddingIndexCache,
  embeddingTopK,
  loadEmbeddingIndex,
} from '../embeddingIndex.js';

const QUESTIONS_PATH = path.join(process.cwd(), 'rag', 'eval', 'questions.json');

async function main() {
  const raw = await readFile(QUESTIONS_PATH, 'utf8');
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    console.error('questions.json doit être un tableau');
    process.exit(1);
  }

  clearCorpusCache();
  clearEmbeddingIndexCache();

  const chunks = await loadCorpusChunks();
  const index = await loadEmbeddingIndex();
  const client = createOpenRouterClient();

  let pass = 0;
  for (const item of items) {
    const question = typeof item.question === 'string' ? item.question : '';
    const expected = Array.isArray(item.expectedSourceSubstrings)
      ? item.expectedSourceSubstrings
      : [];

    let retrieved = [];
    let mode = 'lexical';

    if (index?.chunks?.length && client) {
      try {
        const emb = await embeddingTopK(client, question, 6);
        if (emb?.length) {
          retrieved = emb;
          mode = 'embedding';
        }
      } catch {
        retrieved = [];
      }
    }

    if (!retrieved.length) {
      retrieved = lexicalTopK(question, chunks, 6);
      mode = 'lexical';
    }

    const ok =
      expected.length === 0 ||
      expected.some(
        (sub) =>
          typeof sub === 'string' &&
          retrieved.some(
            (r) =>
              r.source.includes(sub) ||
              (typeof r.text === 'string' && r.text.includes(sub)),
          ),
      );

    if (ok) pass++;
    console.log(`${ok ? 'OK' : 'FAIL'} [${mode}] ${question}`);
    if (!ok) {
      console.log('  attendu une source contenant:', expected.join(' OU '));
      console.log('  obtenu:', retrieved.map((r) => r.source).join(', '));
    }
  }

  console.log(`\n${pass}/${items.length} réussites`);
  process.exit(pass === items.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
