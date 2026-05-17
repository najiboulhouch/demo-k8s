# Demo K8s 🚀

Un projet de démonstration complète pour Kubernetes avec une architecture moderne et scalable.

## 📋 Vue d'ensemble

Ce projet illustre les meilleures pratiques pour déployer et gérer des applications sur Kubernetes. Il inclut des composants frontend, backend et une infrastructure containerisée.

## 🛠️ Stack Technologique

| Technologie | Utilisation | Pourcentage |
|-------------|-------------|-----------|
| **TypeScript** | Backend & Utilitaires | 39.2% |
| **JavaScript** | Frontend & Scripts | 25.9% |
| **SCSS** | Stylisation | 21.1% |
| **Shell** | Automatisation & Déploiement | 7.4% |
| **Dockerfile** | Containerisation | 3.3% |
| **Go Template** | Configuration | 2.7% |
| **HTML** | Templating | 0.4% |

## 🎯 Fonctionnalités Principales

- ✅ Déploiements Kubernetes optimisés
- ✅ Application TypeScript/JavaScript
- ✅ Styling SCSS moderne
- ✅ Containerisation Docker
- ✅ Scripts d'automatisation Shell
- ✅ Configuration templating

## 📁 Structure du Projet

```
demo-k8s/
├── src/                    # Code source
│   ├── backend/           # API TypeScript
│   ├── frontend/          # Application JavaScript
│   └── styles/            # Fichiers SCSS
├── k8s/                   # Manifests Kubernetes
│   ├── deployment.yaml
│   ├── service.yaml
│   └── config/
├── docker/                # Fichiers Docker
│   └── Dockerfile
├── scripts/               # Scripts Shell
│   └── deploy.sh
└── templates/             # Go Templates
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- Docker
- Kubernetes (kubectl)
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/najiboulhouch/demo-k8s.git
cd demo-k8s

# Installer les dépendances
npm install

# Construire le projet
npm run build
```

### Développement Local

```bash
# Démarrer le serveur de développement
npm run dev

# Lancer les tests
npm run test

# Build production
npm run build:prod
```

## 🐳 Docker

### Build l'image Docker

```bash
docker build -t demo-k8s:latest .
```

### Lancer le conteneur

```bash
docker run -p 3000:3000 demo-k8s:latest
```

## ☸️ Déploiement Kubernetes

### Appliquer les manifests

```bash
# Appliquer tous les manifests K8s
kubectl apply -f k8s/

# Vérifier le déploiement
kubectl get deployments
kubectl get pods
kubectl get services
```

### Utiliser les scripts de déploiement

```bash
# Script de déploiement automatisé
./scripts/deploy.sh
```

## 📦 Scripts Disponibles

```bash
npm run dev          # Démarrer en mode développement
npm run build        # Builder le projet
npm run build:prod   # Builder pour la production
npm run test         # Exécuter les tests
npm run lint         # Linter le code
npm run deploy       # Déployer sur K8s
```

## 🔒 Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/demo-k8s
```

## 📝 Configuration Kubernetes

Les fichiers de configuration se trouvent dans le dossier `k8s/` :

- `deployment.yaml` - Définit le déploiement des pods
- `service.yaml` - Expose l'application
- `config/` - Configurations templating avec Go Templates

## 🧪 Tests

```bash
# Exécuter tous les tests
npm run test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🎨 Styles

Les styles sont gérés avec **SCSS** pour une meilleure maintenabilité :

```scss
// Import des variables
@import 'variables';

// Utilisation des mixins
@include responsive-mobile {
  // Styles mobiles
}
```

## 📚 Documentation

- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commiter les changements (`git commit -m 'Add some AmazingFeature'`)
4. Pusher vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👤 Auteur

**Najib Oulhouch**
- GitHub: [@najiboulhouch](https://github.com/najiboulhouch)

## 🆘 Support

Pour toute question ou problème, veuillez ouvrir une [issue](https://github.com/najiboulhouch/demo-k8s/issues).

## 📞 Contact

- Email: [contact email si disponible]
- Issues: [GitHub Issues](https://github.com/najiboulhouch/demo-k8s/issues)

---

**Dernière mise à jour:** 2026-05-17
