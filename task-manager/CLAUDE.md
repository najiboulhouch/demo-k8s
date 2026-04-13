---
description: 
alwaysApply: true
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start           # Dev server at http://localhost:4200 (ng serve)
npm run build       # Production build
npm run watch       # Dev build with file watching
npm test            # Run Karma/Jasmine tests (opens browser)
ng generate component features/tasks/components/<name> --standalone --skip-tests
```

### API IA (dossier voisin `task-manager-api/`)

Démarrer l’API **avant** d’utiliser les boutons IA dans l’app (sinon erreur réseau).

```bash
cd ../task-manager-api
cp .env.example .env   # puis renseigner OPENROUTER_API_KEY (ou OPENAI_API_KEY)
npm install            # une fois
npm run dev            # ou npm start — écoute sur http://localhost:3000
```

Corpus RAG (fichiers `.md` / `.txt`) : `../task-manager-api/rag/corpus/`. Endpoint : `POST /api/ai/rag/ask` avec `{ "question": "...", "topK": 4, "includeTasks": false }`. Embeddings : dans `task-manager-api`, `npm run rag:index` (génère `data/rag-embeddings.json`) ; évaluation retrieval : `npm run rag:eval`.

Santé : `GET http://localhost:3000/health` → `{ "ok": true }`.

`apiBaseUrl` est défini dans `src/environments/environment.ts` (prod) et `environment.development.ts` (remplacement en build `development` dans `angular.json`).

Test runner is Karma + Jasmine. No test files were generated (`skipTests: true` in `angular.json` schematics). Tests run in Chrome.

Prettier is configured in `package.json`: single quotes, 100 char print width, Angular HTML parser.

## Architecture

### State management — Signals only, no RxJS

All application state lives in `TaskService` (`src/app/core/services/task.service.ts`), which is `providedIn: 'root'`. It uses Angular Signals exclusively:

- `tasks` — private writable signal, source of truth
- `allTasks` — `computed()` liste complète (export vers l’IA)
- `filter` — writable signal for active filters
- `filteredTasks` — `computed()` derived from both signals above
- `stats` — `computed()` for header counters

`AiService` (`src/app/core/services/ai.service.ts`) gère l’état des appels HTTP vers l’API (`subtasksLoading`, `lastSubtasks`, `insightsLoading`, `lastInsights`, `ragLoading`, `lastRagAnswer`, etc.) avec des signals. Les requêtes utilisent `HttpClient` et `firstValueFrom` — pas de Subjects pour l’état global.

Components inject `TaskService` directly and read computed signals in templates. There is no store library, no Subjects, no Observables.

`provideHttpClient()` est enregistré dans `app.config.ts`.

### Persistence

`TaskService` synchronise les tâches avec l’API (`json-server` sur `../task-manager-api/data/db.json`) via `GET/POST/PATCH/DELETE` sur `/api/tasks`.

### Component tree

```
App (root, inline template)
├── HeaderComponent       — sticky bar, stats + search + panneaux « Assistant RAG » et « Aperçu de la semaine (IA) »
└── router-outlet
    └── TaskListComponent — lazy-loaded via loadComponent()
        ├── TaskItemComponent (×n) — single task card
        └── TaskFormComponent      — modal overlay (add/edit), suggestion de sous-tâches IA
```

`TaskListComponent` is the only lazy chunk. All other components are eagerly loaded with the root bundle.

### Modal pattern

`TaskFormComponent` is conditionally rendered with `@if (showForm)` inside `TaskListComponent`. Edit mode is initialized via `formRef()?.initEdit(task)` called in a `setTimeout` to wait for the view to render after the signal flips.

### Routing

Single route `''` → `TaskListComponent`. Wildcard redirects to `''`. No guards, no nested routes.

### Styling

All design tokens are CSS custom properties defined in `src/styles.scss` (colors, priority variants, status variants, surfaces). Component SCSS files reference only `var(--token-name)` — no hardcoded colors. Font is Inter via Google Fonts CDN.

### TypeScript strictness

`strict: true` + `strictTemplates: true` + `noImplicitReturns`. All new code must satisfy these. The `Task` interface uses union string literal types for `priority`, `status`, and `category` — avoid using plain `string` for these fields.
