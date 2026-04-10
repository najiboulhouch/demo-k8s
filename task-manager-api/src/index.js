import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/ai.js';
import { createJsonDbRouter } from './jsondb/jsondb.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(cors({ origin: corsOrigin, credentials: false }));
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// AI routes must be mounted before json-server, otherwise json-server will swallow /api/ai/*
app.use('/api/ai', aiRouter);

// JSON DB (json-server): exposes REST endpoints under /api, e.g.:
// GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id
const { middlewares: jsonDbMiddlewares, router: jsonDbRouter } = createJsonDbRouter();
app.use('/api', jsonDbMiddlewares);
app.use('/api', jsonDbRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur inattendue.' });
});

app.listen(PORT, () => {
  console.log(`task-manager-api listening on http://localhost:${PORT}`);
});
