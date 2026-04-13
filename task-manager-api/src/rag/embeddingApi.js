/**
 * @param {import('openai').OpenAI} client
 * @param {string} model
 * @param {string[]} inputs
 */
export async function embedTexts(client, model, inputs) {
  const res = await client.embeddings.create({
    model,
    input: inputs,
  });
  const out = [];
  const sorted = [...res.data].sort((x, y) => x.index - y.index);
  for (const row of sorted) {
    out.push(row.embedding);
  }
  return out;
}
