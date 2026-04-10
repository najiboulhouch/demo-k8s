import { Router } from 'express';
import OpenAI from 'openai';

export const aiRouter = Router();

function getOpenAI() {
  // OpenRouter is OpenAI-SDK compatible via baseURL + apiKey.
  // Keep OPENAI_API_KEY as a fallback for convenience.
  const key = (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  if (!key) {
    return null;
  }

  const referer = (process.env.OPENROUTER_REFERER || '').trim();
  const title = (process.env.OPENROUTER_TITLE || 'Task Manager (local dev)').trim();

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    defaultHeaders: {
      ...(referer ? { 'HTTP-Referer': referer } : {}),
      // OpenRouter attribution header (optional but recommended)
      'X-OpenRouter-Title': title,
    },
  });
}

function model() {
  // OpenRouter model ids look like: "openai/gpt-4o-mini"
  return (process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-4o-mini').trim();
}

function requireOpenAI(res) {
  const client = getOpenAI();
  if (!client) {
    res.status(503).json({
      error:
        'Service IA indisponible : définissez OPENAI_API_KEY dans un fichier .env (voir .env.example).',
    });
    return null;
  }
  return client;
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
