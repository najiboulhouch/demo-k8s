import jsonServer from 'json-server';
import path from 'node:path';

export function createJsonDbRouter() {
  const dbPath = (process.env.DB_PATH || '').trim() || path.join(process.cwd(), 'data', 'db.json');
  const router = jsonServer.router(dbPath);
  const middlewares = jsonServer.defaults({ logger: false });

  // json-server already parses JSON via body-parser internally, but we keep our global express.json too.
  return { middlewares, router };
}

