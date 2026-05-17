# Demo K8s - Task Manager 🚀

Un projet de démonstration complet avec **Kubernetes**, **Helm**, **ArgoCD**.

Application complète de gestion de tâches qui utilise l'API de openrouter pour communiquer ave un LLM(OpenIA) et déployée après sur Kubernetes avec GitOps via ArgoCD ou Helm.

## 📋 Vue d'ensemble

Ce projet illustre une architecture d'application moderne avec :
- **Frontend** : Angular (SPA)
- **Backend** : API TypeScript/Node.js
- **Orchestration** : Kubernetes
- **Package Management** : Helm Charts
- **GitOps** : ArgoCD pour le déploiement continu
  
```

## 🛠️ Stack Technologique

| Composant | Technologie | Utilisation |
|-----------|------------|------------|
| **Frontend** | Angular, TypeScript, SCSS | Interface utilisateur |
| **Backend** | TypeScript, Node.js | API REST |
| **DevOps** | Kubernetes, Helm, ArgoCD | Orchestration & GitOps |
| **Containerisation** | Docker | Images & Registre |

## 🚀 Démarrage Rapide

### Prérequis

```bash
# Version minimale
- Node.js 18+
- Docker
- Kubernetes (kubectl) 1.24+
- Helm 3+
- ArgoCD (optionnel pour GitOps)
```

### Installation Locale

#### 1. Frontend (Angular)

```bash
cd task-manager
npm install
npm start

# L'app sera disponible sur http://localhost:4200
```

#### 2. Backend (API)

```bash
cd task-manager-api
npm install
npm run dev

# L'API sera disponible sur http://localhost:3000
```

## ☸️ Déploiement Kubernetes

### Avec Manifests Bruts

```bash
cd Devops/k8s

# Déployer tous les manifests
kubectl apply -f deployment/
kubectl apply -f service/
kubectl apply -f ingress/

# Vérifier le déploiement
kubectl get pods
kubectl get svc
kubectl get ingress
```

### Avec Helm (Recommandé)

```bash
cd Devops/helm

# Installer les charts
helm install task-manager ./task-manager/
helm install task-manager-api ./task-manager-api/

# Lister les releases
helm list

# Mettre à jour
helm upgrade task-manager ./task-manager/
helm upgrade task-manager-api ./task-manager-api/

# Désinstaller
helm uninstall task-manager
helm uninstall task-manager-api
```

### Avec ArgoCD (GitOps)

```bash
# Installer ArgoCD (si pas déjà fait)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Accéder à ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Se connecter à ArgoCD (par défaut: admin)
argocd login localhost:8080

# Déployer les applications ArgoCD
cd Devops/argocd
kubectl apply -f applicationset/applicationset-list.yaml
kubectl apply -f appsofapps/root-app.yaml

# Vérifier le statut
argocd app list
argocd app status task-manager
```

## 🔄 Flux de Déploiement

```
Git Push → ArgoCD Webhook → Détecte changement
       ↓
   Helm Charts → Valide les templates
       ↓
Kubernetes API → Applique les manifests
       ↓
   Pods déployés → Service expose l'app
```

## 📦 Scripts npm

### Frontend

```bash
npm start              # Mode développement
npm run build          # Build production
npm run test           # Tests unitaires
npm run lint           # Linter le code
npm run serve:ssr      # SSR mode
```

### Backend

```bash
npm run dev            # Mode développement
npm run build          # Compiler TypeScript
npm run prod           # Mode production
npm test               # Tests unitaires
npm run lint           # Linter le code
```
