import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

/**
 * @returns {Promise<{ id: string, source: string, text: string }[]>}
 */
export async function loadTasksAsChunks() {
  try {
    const raw = await readFile(DB_PATH, 'utf8');
    const data = JSON.parse(raw);
    const tasks = data?.tasks;
    if (!Array.isArray(tasks)) return [];

    return tasks.map((t) => {
      const id = String(t?.id ?? '');
      const title = typeof t?.title === 'string' ? t.title : '';
      const desc = typeof t?.description === 'string' ? t.description : '';
      const status = typeof t?.status === 'string' ? t.status : '';
      const priority = typeof t?.priority === 'string' ? t.priority : '';
      const category = typeof t?.category === 'string' ? t.category : '';
      const dueTime = typeof t?.dueTime === 'string' && t.dueTime ? t.dueTime : '';
      const line = [
        `Tâche: ${title}`,
        desc && `Description: ${desc}`,
        dueTime && `Heure limite: ${dueTime}`,
        `Statut: ${status}`,
        `Priorité: ${priority}`,
        `Catégorie: ${category}`,
      ]
        .filter(Boolean)
        .join('\n');

      return {
        id: `task:${id || crypto.randomUUID()}`,
        source: `data/db.json (tâche ${id || '?'})`,
        text: line,
      };
    });
  } catch {
    return [];
  }
}
