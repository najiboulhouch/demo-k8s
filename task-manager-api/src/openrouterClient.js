import OpenAI from 'openai';

export function createOpenRouterClient() {
  const key = (process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  if (!key) return null;

  const referer = (process.env.OPENROUTER_REFERER || '').trim();
  const title = (process.env.OPENROUTER_TITLE || 'Task Manager (local dev)').trim();

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    defaultHeaders: {
      ...(referer ? { 'HTTP-Referer': referer } : {}),
      'X-OpenRouter-Title': title,
    },
  });
}

export function chatModel() {
  return (process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-4o-mini').trim();
}

export function embeddingModel() {
  return (
    process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || 'openai/text-embedding-3-small'
  );
}
