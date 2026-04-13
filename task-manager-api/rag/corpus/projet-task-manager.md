# Task Manager — notes projet

Ce dépôt contient une application Angular (`task-manager`) et une API Node (`task-manager-api`).

## Persistance des tâches

Les tâches sont stockées dans un fichier JSON local via **json-server** (`data/db.json`). L’API expose des routes REST sous `/api/tasks`.

## Intelligence artificielle

Les fonctionnalités IA passent par **OpenRouter** (clé `OPENROUTER_API_KEY`). Les routes sont préfixées par `/api/ai/`.

## RAG (aperçu)

Le RAG combine une **recherche** dans un corpus de documents locaux puis un **appel au modèle** avec le contexte récupéré. Par défaut : recherche **lexicale** ; avec `npm run rag:index`, un fichier `data/rag-embeddings.json` permet la recherche par **similarité (embeddings)** si `RAG_USE_EMBEDDINGS` n’est pas à `false`. Les tâches de `data/db.json` peuvent être fusionnées dans le contexte via l’option `includeTasks` sur l’API.
