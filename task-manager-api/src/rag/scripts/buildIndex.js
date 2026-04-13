import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createOpenRouterClient, embeddingModel } from '../../openrouterClient.js';
import { clearCorpusCache, loadCorpusChunks } from '../loadCorpus.js';
import { embedTexts } from '../embeddingApi.js';
import { clearEmbeddingIndexCache } from '../embeddingIndex.js';

const BATCH = 16;
const OUT = path.join(process.cwd(), 'data', 'rag-embeddings.json');

async function main() {
  const client = createOpenRouterClient();
  if (!client) {
    console.error('Définissez OPENROUTER_API_KEY (ou OPENAI_API_KEY) dans .env');
    process.exit(1);
  }

  clearCorpusCache();
  clearEmbeddingIndexCache();

  const model = embeddingModel();
  const chunks = await loadCorpusChunks();
  if (!chunks.length) {
    console.error('Corpus vide : ajoutez des fichiers dans rag/corpus/');
    process.exit(1);
  }

  const out = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const vectors = await embedTexts(
      client,
      model,
      batch.map((c) => c.text),
    );
    for (let j = 0; j < batch.length; j++) {
      out.push({
        id: batch[j].id,
        source: batch[j].source,
        text: batch[j].text,
        embedding: vectors[j],
      });
    }
    console.log(`Embeddings ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify(
      {
        model,
        createdAt: new Date().toISOString(),
        chunks: out,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Index écrit : ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
