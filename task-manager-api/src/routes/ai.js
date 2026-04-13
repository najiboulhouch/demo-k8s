import { Router } from 'express';
import { chatModel, createOpenRouterClient } from '../openrouterClient.js';
import { loadCorpusChunks } from '../rag/loadCorpus.js';
import { lexicalTopK } from '../rag/lexicalSearch.js';
import { embeddingTopK } from '../rag/embeddingIndex.js';
import { loadTasksAsChunks } from '../rag/tasksAsChunks.js';

export const aiRouter = Router();

function getOpenAI() {
  return createOpenRouterClient();
}

function model() {
  return chatModel();
}

function requireOpenAI(res) {
  const client = getOpenAI();
  if (!client) {
    res.status(503).json({
      error:
        'Service IA indisponible : définissez OPENROUTER_API_KEY (ou OPENAI_API_KEY). ' +
        'En local : copiez task-manager-api/.env.example vers task-manager-api/.env et renseignez la clé (OpenRouter). ' +
        'Avec Docker Compose : même fichier, ou un .env à la racine du dépôt contenant OPENROUTER_API_KEY=… Puis redémarrez l’API.',
    });
    return null;
  }
  return client;
}

function stripChunk(c) {
  if (!c) return null;
  const { score, ...rest } = c;
  void score;
  return rest;
}

function parseJsonContent(raw, res, fallbackMessage) {
  if (!raw) {
    res.status(502).json({ error: fallbackMessage });
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    res.status(502).json({ error: 'Réponse du modèle invalide (JSON attendu).' });
    return null;
  }
}

aiRouter.post('/suggest-subtasks', async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  const { title, description } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Le champ « title » est requis.' });
    return;
  }

  const desc =
    typeof description === 'string' && description.trim() ? description.trim() : '';

  const system = `Tu es un assistant de productivité. Réponds uniquement avec un JSON valide, sans markdown.
Schéma exact : {"subtasks":[{"title":"string"}]}
Règles : 3 à 8 sous-tâches courtes et actionnables en français ; titres uniques ; pas de clés autres que subtasks.`;

  const user = `Tâche principale : ${title.trim()}
${desc ? `Détails : ${desc}` : ''}

Propose des sous-tâches ordonnées pour mener à bien cette tâche.`;

  try {
    const completion = await client.chat.completions.create({
      model: model(),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    const data = parseJsonContent(content, res, 'Réponse vide du modèle.');
    if (!data) return;

    const subtasks = Array.isArray(data.subtasks) ? data.subtasks : null;
    if (!subtasks) {
      res.status(502).json({ error: 'Format inattendu : « subtasks » manquant.' });
      return;
    }

    const cleaned = subtasks
      .map((s) => (typeof s?.title === 'string' ? s.title.trim() : ''))
      .filter(Boolean)
      .slice(0, 8)
      .map((t) => ({ title: t }));

    if (cleaned.length === 0) {
      res.status(502).json({ error: 'Aucune sous-tâche exploitable dans la réponse.' });
      return;
    }

    res.json({ subtasks: cleaned });
  } catch (e) {
    console.error('suggest-subtasks', e);
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    res.status(502).json({ error: `Échec de l’appel au modèle : ${msg}` });
  }
});

aiRouter.post('/week-insights', async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  const { tasks } = req.body ?? {};
  if (!Array.isArray(tasks)) {
    res.status(400).json({ error: 'Le champ « tasks » doit être un tableau.' });
    return;
  }

  const slim = tasks.slice(0, 100).map((t) => ({
    title: typeof t?.title === 'string' ? t.title : '',
    status: typeof t?.status === 'string' ? t.status : '',
    priority: typeof t?.priority === 'string' ? t.priority : '',
    category: typeof t?.category === 'string' ? t.category : '',
    dueTime: typeof t?.dueTime === 'string' ? t.dueTime : undefined,
  }));

  const system = `Tu es un coach productivité. Réponds uniquement avec un JSON valide, sans markdown.
Schéma exact : {"sections":[{"heading":"string","body":"string"}]}
Règles : 3 à 5 sections en français ; titres courts ; corps en paragraphes concis (priorités, risques de surcharge, suggestion d’ordre de traitement, encouragement).`;

  const user = `Voici les tâches actuelles (JSON) :\n${JSON.stringify(slim)}`;

  try {
    const completion = await client.chat.completions.create({
      model: model(),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;
    const data = parseJsonContent(content, res, 'Réponse vide du modèle.');
    if (!data) return;

    const sections = Array.isArray(data.sections) ? data.sections : null;
    if (!sections) {
      res.status(502).json({ error: 'Format inattendu : « sections » manquant.' });
      return;
    }

    const cleaned = sections
      .map((s) => ({
        heading: typeof s?.heading === 'string' ? s.heading.trim() : '',
        body: typeof s?.body === 'string' ? s.body.trim() : '',
      }))
      .filter((s) => s.heading && s.body)
      .slice(0, 6);

    if (cleaned.length === 0) {
      res.status(502).json({ error: 'Aucune section exploitable dans la réponse.' });
      return;
    }

    res.json({ sections: cleaned });
  } catch (e) {
    console.error('week-insights', e);
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    res.status(502).json({ error: `Échec de l’appel au modèle : ${msg}` });
  }
});

aiRouter.post('/rag/ask', async (req, res) => {
  const client = requireOpenAI(res);
  if (!client) return;

  const { question, topK, includeTasks } = req.body ?? {};
  if (typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: 'Le champ « question » est requis.' });
    return;
  }

  const k = Math.min(8, Math.max(1, Number(topK) || 4));
  const q = question.trim();
  const mergeTasks = includeTasks === true;
  const useEmb = process.env.RAG_USE_EMBEDDINGS !== 'false';

  let retrieved = [];
  let retrievalMethod = 'lexical';

  if (useEmb) {
    try {
      const emb = await embeddingTopK(client, q, k);
      if (emb?.length) {
        retrieved = emb.map(stripChunk).filter(Boolean);
        retrievalMethod = 'embedding';
      }
    } catch (e) {
      console.warn('rag embedding retrieval', e);
    }
  }

  if (!retrieved.length) {
    let chunks;
    try {
      chunks = await loadCorpusChunks();
    } catch (e) {
      console.error('rag corpus', e);
      res.status(500).json({ error: 'Impossible de charger le corpus RAG.' });
      return;
    }
    if (chunks.length) {
      retrieved = lexicalTopK(q, chunks, k).map(stripChunk).filter(Boolean);
      retrievalMethod = 'lexical';
    }
  }

  if (!retrieved.length) {
    res.status(503).json({
      error:
        'Aucun passage disponible : ajoutez des fichiers dans rag/corpus/ et/ou générez data/rag-embeddings.json (npm run rag:index).',
    });
    return;
  }

  if (mergeTasks) {
    try {
      const taskChunks = await loadTasksAsChunks();
      const topTasks = lexicalTopK(q, taskChunks, Math.min(3, k));
      const seen = new Set(retrieved.map((r) => r.id));
      for (const t of topTasks) {
        const n = stripChunk(t);
        if (n && !seen.has(n.id)) {
          seen.add(n.id);
          retrieved.push(n);
        }
        if (retrieved.length >= 8) break;
      }
    } catch (e) {
      console.warn('rag includeTasks', e);
    }
  }

  const forContext = retrieved.slice(0, 8);
  const contextBlocks = forContext.map((c, i) => {
    const excerpt = c.text.length > 600 ? `${c.text.slice(0, 600)}…` : c.text;
    return `[${i + 1}] source: ${c.source}\n${excerpt}`;
  });

  console.log('[rag] question:', q);
  console.log('[rag] retrievalMethod:', retrievalMethod, '| includeTasks:', mergeTasks);
  console.log(
    '[rag] passages dans le prompt:',
    forContext.map((c) => ({ source: c.source, len: c.text.length })),
  );

  const system = `Tu es un assistant qui répond en t'appuyant UNIQUEMENT sur le contexte fourni ci-dessous.
Si le contexte ne permet pas de répondre, dis-le clairement en français.
Réponds uniquement avec un JSON valide, sans markdown.
Schéma exact : {"answer":"string","citations":[{"source":"string","excerpt":"string"}]}
Règles : "citations" doit lister les sources du contexte réellement utilisées (chemins source) ; chaque excerpt est un court extrait (max ~200 caractères) tiré du contexte.`;

  const user = `Question : ${question.trim()}

Contexte (passages récupérés) :
${contextBlocks.join('\n\n---\n\n')}`;

  try {
    const completion = await client.chat.completions.create({
      model: model(),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;
    console.log('[rag] LLM brut (message.content):', content?.slice(0, 2000) ?? '(vide)');

    const data = parseJsonContent(content, res, 'Réponse vide du modèle.');
    if (!data) return;

    const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
    console.log('[rag] LLM parsé — answer:', answer?.slice(0, 500));
    console.log('[rag] LLM parsé — citations:', data.citations);
    const citations = Array.isArray(data.citations)
      ? data.citations
          .map((c) => ({
            source: typeof c?.source === 'string' ? c.source.trim() : '',
            excerpt: typeof c?.excerpt === 'string' ? c.excerpt.trim() : '',
          }))
          .filter((c) => c.source && c.excerpt)
          .slice(0, 8)
      : [];

    if (!answer) {
      res.status(502).json({ error: 'Réponse vide ou invalide.' });
      return;
    }

    res.json({
      answer,
      citations,
      retrievalMethod,
      includeTasks: mergeTasks,
      retrieved: forContext.map((c) => ({
        source: c.source,
        excerpt: c.text.length > 220 ? `${c.text.slice(0, 220)}…` : c.text,
      })),
    });
  } catch (e) {
    console.error('rag/ask', e);
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    res.status(502).json({ error: `Échec de l’appel au modèle : ${msg}` });
  }
});
