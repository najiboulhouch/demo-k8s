# Demo K8s - Task Manager 🚀

Un projet de démonstration complet avec **Kubernetes**, **Helm**, **ArgoCD** et une architecture microservices moderne.

Application complète de gestion de tâches déployée sur Kubernetes avec GitOps via ArgoCD.

## 📋 Vue d'ensemble

Ce projet illustre une architecture d'application moderne avec :
- **Frontend** : Angular (SPA)
- **Backend** : API TypeScript/Node.js
- **Orchestration** : Kubernetes
- **Package Management** : Helm Charts
- **GitOps** : ArgoCD pour le déploiement continu

## 🏗️ Architecture

```
demo-k8s/
├── task-manager/              # 🎨 Frontend Angular
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── Dockerfile
│
├── task-manager-api/          # 🔌 Backend API TypeScript
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
└── Devops/                    # ☸️ Infrastructure
    ├── k8s/                   # Manifests Kubernetes bruts
    │   ├── deployment/
    │   ├── service/
    │   └── ingress/
    ├── helm/                  # Helm Charts
    │   ├── task-manager/
    │   ├── task-manager-api/
    │   └── values.yaml
    └── argocd/                # Configuration ArgoCD
        ├── applications/
        └── projects/
```

## 🛠️ Stack Technologique

| Composant | Technologie | Utilisation |
|-----------|------------|------------|
| **Frontend** | Angular, TypeScript, SCSS | Interface utilisateur |
| **Backend** | TypeScript, Node.js | API REST |
| **DevOps** | Kubernetes, Helm, ArgoCD | Orchestration & GitOps |
| **Containerisation** | Docker | Images & Registre |
| **Infrastructure** | Go Templates | Configuration |

## 📊 Composition du Projet

- **TypeScript** : 39.2%
- **JavaScript** : 25.9%
- **SCSS** : 21.1%
- **Shell** : 7.4%
- **Dockerfile** : 3.3%
- **Go Template** : 2.7%
- **HTML** : 0.4%

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

## 🐳 Build Docker

### Frontend

```bash
cd task-manager
docker build -t demo-k8s-task-manager:latest .
docker push your-registry/demo-k8s-task-manager:latest
```

### Backend

```bash
cd task-manager-api
docker build -t demo-k8s-task-manager-api:latest .
docker push your-registry/demo-k8s-task-manager-api:latest
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

# Ajouter les repos Helm si nécessaire
helm repo add stable https://charts.helm.sh/stable

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
kubectl apply -f applications/
kubectl apply -f projects/

# Vérifier le statut
argocd app list
argocd app status task-manager
```

## 📝 Variables d'Environnement

### Backend (.env)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://mongo:27017/task-manager
CORS_ORIGIN=http://localhost:4200
LOG_LEVEL=info
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
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

## 🔐 Sécurité

- Utiliser des **secrets Kubernetes** pour les données sensibles
- Configurer les **NetworkPolicies** pour la communication
- Mettre en place des **RBAC** pour le contrôle d'accès
- Scanner les images Docker avec Trivy

```bash
# Appliquer les secrets
kubectl create secret generic db-secret --from-literal=password=mysecret

# Voir les secrets
kubectl get secrets
```

## 📊 Monitoring & Logs

```bash
# Logs des pods
kubectl logs -f deployment/task-manager
kubectl logs -f deployment/task-manager-api

# Port forward pour déboguer
kubectl port-forward svc/task-manager 4200:80
kubectl port-forward svc/task-manager-api 3000:3000

# Vérifier les ressources
kubectl top nodes
kubectl top pods
```

## 🧪 Tests

### Frontend

```bash
cd task-manager
npm test
```

### Backend

```bash
cd task-manager-api
npm test
```

## 📚 Documentation Utile

- [Angular Documentation](https://angular.io/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. **Fork** le projet
2. **Créer une branche** (`git checkout -b feature/AmazingFeature`)
3. **Commiter** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Pusher** (`git push origin feature/AmazingFeature`)
5. **Ouvrir une Pull Request**

## 📋 Checklist pour le Déploiement

- [ ] Images Docker buildées et pushées
- [ ] Secrets Kubernetes configurés
- [ ] Values.yaml Helm adaptés
- [ ] Ingress configuré avec domaine
- [ ] ArgoCD configuré et synchronisé
- [ ] Tests unitaires passants
- [ ] Manifests validés (`kubectl apply --dry-run=client`)
- [ ] Monitoring/Logs configurés
- [ ] Backups configurés
- [ ] Documentation à jour

## 🐛 Troubleshooting

### Pod ne démarre pas

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Service inaccessible

```bash
kubectl get svc
kubectl port-forward svc/task-manager 4200:80
```

### ArgoCD désynchronisé

```bash
argocd app sync task-manager
argocd app refresh task-manager
```

## 📞 Contact & Support

- **Auteur** : [Najib Oulhouch](https://github.com/najiboulhouch)
- **Issues** : [GitHub Issues](https://github.com/najiboulhouch/demo-k8s/issues)
- **Discussions** : [GitHub Discussions](https://github.com/najiboulhouch/demo-k8s/discussions)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Dernière mise à jour** : 2026-05-17

✨ **Merci d'utiliser Demo K8s !** ✨
