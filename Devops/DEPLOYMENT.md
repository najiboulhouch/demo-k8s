# Guide de déploiement — Docker Compose → Kubernetes (Minikube) → Helm

Ce guide décrit les **étapes reproductibles** pour exécuter le projet en :

- **Docker Compose** (local)
- **Kubernetes via Minikube (WSL2)** avec manifests YAML
- **Helm** (déploiement Kubernetes recommandé)

> Contexte : l’application contient un **front Angular** servi par **nginx** et une **API Node/Express + json-server** (routes IA/RAG optionnelles via OpenRouter).

---

## Docker Compose (local)

### Prérequis
- Docker + Docker Compose
- (Option IA) une clé OpenRouter : `OPENROUTER_API_KEY`

### 1) Configurer l’API (option IA)
Créer `task-manager-api/.env` à partir de `task-manager-api/.env.example`, puis renseigner au minimum :

- `OPENROUTER_API_KEY=...` (optionnel)
- `CORS_ORIGIN=http://localhost:8080`

### 2) Lancer
Depuis le dossier `Docker/` :

```bash
docker compose -f Docker/docker-compose.yml up --build
```

### 3) Accès
- **Front** : `http://localhost:8080`
- **Health API** : `http://localhost:3000/health`
- **Tasks API** : `http://localhost:3000/api/tasks`

---

## Kubernetes (Minikube sur WSL2) — manifests YAML

### Prérequis
- WSL2
- `minikube`, `kubectl`, `docker`
- Addon ingress : `ingress-nginx` (Minikube)

### Déploiement “one shot” (recommandé)
Le repo contient un script qui enchaîne :
- start Minikube (driver docker)
- activation ingress
- patch LoadBalancer du contrôleur ingress
- build des images dans le Docker de Minikube
- création du secret OpenRouter si la clé est disponible
- `kubectl apply` des manifests

Depuis WSL2, à la racine du repo :

```bash
bash Devops/k8s/deploy-minikube.sh
```

Ensuite, pour exposer l’Ingress vers Windows, lancer (terminal dédié) :

```bash
bash Devops/k8s/minikube-tunnel.sh
```

> Le script tunnel utilise `sudo` par défaut (ports 80/443).

---

### 1) Démarrer Minikube

```bash
minikube start --driver=docker
minikube addons enable ingress
```

### 2) Builder les images **dans** Minikube

Important : builder dans le Docker de Minikube, sinon le cluster ne trouvera pas les images.

```bash
eval "$(minikube docker-env)"

# Build via docker compose avec un override k8s qui force API_BASE_URL="" (front → /api/* sur le même host Ingress).
docker compose -f Docker/docker-compose.yml -f Docker/docker-compose.k8s.yml build
```

### 3) Déployer avec les YAML

```bash
kubectl apply -f Devops/k8s/deployment-api.yaml -f Devops/k8s/service-api.yaml \
  -f Devops/k8s/deployment-web.yaml -f Devops/k8s/service-web.yaml \
  -f Devops/k8s/ingress.yaml
```

### 4) (Option IA) Secret OpenRouter

```bash
kubectl create secret generic task-manager-secrets \
  --from-literal=OPENROUTER_API_KEY="sk-or-v1-..." \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/task-manager-api
```

### 5) Accès depuis Windows

#### Option A — `minikube tunnel` (ports 80/443)
Dans WSL, dans un terminal dédié (laisser tourner) :

```bash
bash Devops/k8s/minikube-tunnel.sh
```

Puis, dans le fichier hosts Windows (admin) :

```text
127.0.0.1  task-manager.local
```

Ouvrir :
- `http://task-manager.local`

---

## Kubernetes (Minikube) — Helm (recommandé)

Chart : `Devops/helm/task-manager`

### 1) Builder les images (dans Minikube)

```bash
eval "$(minikube docker-env)"

docker compose -f Docker/docker-compose.yml -f Docker/docker-compose.k8s.yml build
```

### 2) Installer / mettre à jour le release

```bash
helm upgrade --install task-manager Devops/helm/task-manager \
  --namespace task-manager --create-namespace
```

### 3) (Option IA) Injecter la clé OpenRouter

#### Option A — Secret géré par Helm (local / simple)

```bash
helm upgrade --install task-manager Devops/helm/task-manager \
  -n task-manager --create-namespace \
  --set openrouter.createSecret=true \
  --set openrouter.apiKey="sk-or-v1-..."
```

#### Option B — Secret existant

```bash
kubectl -n task-manager create secret generic task-manager-secrets \
  --from-literal=OPENROUTER_API_KEY="sk-or-v1-..." \
  --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install task-manager Devops/helm/task-manager \
  -n task-manager --create-namespace \
  --set openrouter.existingSecret=task-manager-secrets
```

### 4) Vérifications

```bash
kubectl get pods -n task-manager
kubectl get svc -n task-manager
kubectl get ingress -n task-manager
```

### 5) Accès (comme manifests)
- Tunnel : `http://task-manager.local`

---

## Dépannage rapide

### 1) `net::ERR_CONNECTION_REFUSED` sur `/api/tasks`
Causes fréquentes :
- Le front appelle `http://localhost:3000` (build incorrect) au lieu de `/api/...`
  - Rebuild le front avec `--build-arg API_BASE_URL=`
- L’Ingress/tunnel n’est pas actif
  - `bash Devops/k8s/minikube-tunnel.sh`

### 2) 404 sur `GET /api/tasks` derrière Kubernetes
Vérifier que l’API lit bien la base sur un chemin writable :
- `DB_PATH` doit pointer sur un volume (ex. `/data/db.json`)
- Le chart Helm initialise `/data/db.json` via l’initContainer `seed-db`

### 3) Vérifier rapidement les backends

```bash
kubectl get pods -n task-manager
kubectl get endpoints -n task-manager
kubectl logs -n task-manager -l app.kubernetes.io/component=api --tail=100
```

---

## Vérifications sécurité (Dockle / Trivy / Kubescape)

Ces commandes permettent de contrôler la sécurité **des images Docker** et **des manifests Kubernetes/Helm**.

### Dockle (images Docker)

Après build des images :

```bash
dockle task-manager-api:v1
dockle task-manager-web:v1
```

Si Dockle signale un faux positif sur un nom de variable (ex. `KEY_SHA512` dans des layers upstream), utilisez la liste d’acceptation de Dockle (selon votre version) ou changez d’image de base.

### Trivy (filesystem / Helm / secrets)

Scanner tout le repo (misconfig + secrets) :

```bash
trivy fs --scanners vuln,secret,misconfig .
```

Scanner spécifiquement le chart Helm :

```bash
trivy config Devops/helm/task-manager
```

Scanner une image :

```bash
trivy image task-manager-api:v1
trivy image task-manager-web:v1
```

### Kubescape (YAML Kubernetes / Helm)

Contrôle ciblé (ex. non-root containers) sur les manifests :

```bash
kubescape scan control C-0013 Devops/k8s/*.yaml -v
```

Framework complet (ex. DevOpsBest) sur le chart Helm :

```bash
kubescape scan framework DevOpsBest Devops/helm/task-manager/ -v
```

> Pour scanner le rendu Helm avec un namespace (évite les faux “null namespace”), vous pouvez aussi faire :
>
> ```bash
> helm template task-manager Devops/helm/task-manager --namespace task-manager | kubescape scan -
> ```

