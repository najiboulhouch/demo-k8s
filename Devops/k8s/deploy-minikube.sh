#!/usr/bin/env bash
# Minikube (driver Docker) + build des images dans le Docker de Minikube + apply des manifests.
# Prérequis : minikube, kubectl, docker ; exécuter depuis WSL2 (même contexte que Minikube).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Charge OPENROUTER_API_KEY (ou OPENAI_API_KEY) depuis l’environnement courant ou les .env
# (même logique que Docker Compose : task-manager-api/.env puis .env à la racine).
resolve_openrouter_for_k8s() {
  if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
    OPENROUTER_API_KEY="${OPENROUTER_API_KEY//$'\r'/}"
    [[ -n "${OPENROUTER_API_KEY// }" ]] && return 0
  fi
  local envf
  for envf in "$ROOT/task-manager-api/.env" "$ROOT/.env"; do
    [[ -f "$envf" ]] || continue
    set +u
    set -a
    # shellcheck disable=SC1090
    source "$envf" || true
    set +a
    set -u
    if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
      OPENROUTER_API_KEY="${OPENROUTER_API_KEY//$'\r'/}"
      [[ -n "${OPENROUTER_API_KEY// }" ]] || continue
      echo "==> OPENROUTER_API_KEY chargée depuis ${envf#$ROOT/}"
      return 0
    fi
    if [[ -n "${OPENAI_API_KEY:-}" ]]; then
      OPENROUTER_API_KEY="${OPENAI_API_KEY//$'\r'/}"
      [[ -n "${OPENROUTER_API_KEY// }" ]] || continue
      export OPENROUTER_API_KEY
      echo "==> OPENROUTER_API_KEY dérivée de OPENAI_API_KEY (${envf#$ROOT/})"
      return 0
    fi
  done
  return 1
}

echo "==> Démarrage Minikube (driver docker)"
minikube start --driver=docker

echo "==> Ingress NGINX (--wait n’existe pas sur toutes les versions de minikube)"
minikube addons enable ingress

echo "==> Attente du contrôleur ingress-nginx (jusqu’à 5 min)"
if kubectl wait --namespace ingress-nginx \
  deployment/ingress-nginx-controller \
  --for=condition=Available \
  --timeout=300s 2>/dev/null; then
  :
elif kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  -l app.kubernetes.io/component=controller \
  --timeout=180s 2>/dev/null; then
  :
elif kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  -l app.kubernetes.io/name=ingress-nginx \
  --timeout=180s 2>/dev/null; then
  :
else
  echo "Avertissement : contrôleur ingress pas prêt (noms/labels selon version Minikube). Vérifiez :"
  echo "    kubectl get deploy,pods -n ingress-nginx"
fi

# L’addon ingress livre souvent un Service en NodePort → EXTERNAL-IP vide ; minikube tunnel
# n’attribue une IP qu’aux Services LoadBalancer.
echo "==> Ingress : passage du contrôleur en LoadBalancer (pour EXTERNAL-IP + minikube tunnel)"
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  --type=merge \
  -p '{"spec":{"type":"LoadBalancer"}}' || {
  echo "Avertissement : patch LoadBalancer impossible (vérifiez le nom du service : kubectl get svc -n ingress-nginx)."
}

echo "==> Build des images dans le Docker de Minikube (pas le Docker Desktop par défaut)"
eval "$(minikube -p minikube docker-env)"
docker compose -f docker-compose.yml -f docker-compose.k8s.yml build

resolve_openrouter_for_k8s || true

if [[ -n "${OPENROUTER_API_KEY:-}" && -n "${OPENROUTER_API_KEY// }" ]]; then
  echo "==> Secret Kubernetes task-manager-secrets (clé OpenRouter)"
  kubectl delete secret task-manager-secrets --ignore-not-found
  kubectl create secret generic task-manager-secrets \
    --from-literal="OPENROUTER_API_KEY=${OPENROUTER_API_KEY}"
else
  echo "==> Pas de OPENROUTER_API_KEY (variable, task-manager-api/.env ou .env à la racine)."
  echo "    Renseignez la clé puis :"
  echo "    kubectl create secret generic task-manager-secrets --from-literal=OPENROUTER_API_KEY=VOTRE_CLE"
  echo "    kubectl rollout restart deployment/task-manager-api"
fi

echo "==> Déploiement Kubernetes"
kubectl apply -f "$ROOT/k8s/deployment-api.yaml" \
  -f "$ROOT/k8s/service-api.yaml" \
  -f "$ROOT/k8s/deployment-web.yaml" \
  -f "$ROOT/k8s/service-web.yaml" \
  -f "$ROOT/k8s/ingress.yaml"

IP="$(minikube ip)"
echo ""
echo "==> Terminé."
echo ""
echo "--- Accès depuis le navigateur Windows (recommandé : tunnel) ---"
echo "1) Dans un AUTRE terminal WSL, lancez et laissez tourner :"
echo "     ./k8s/minikube-tunnel.sh"
echo "   (sudo par défaut pour 80/443 — évite le tunnel partiel. Sans sudo : MINIKUBE_TUNNEL_NO_SUDO=1 ./k8s/minikube-tunnel.sh)"
echo ""
echo "2) Vérifiez le service (après patch LoadBalancer + tunnel actif, EXTERNAL-IP doit être 127.0.0.1 ou une IP) :"
echo "     kubectl get svc -n ingress-nginx ingress-nginx-controller"
echo "   Si type reste NodePort et EXTERNAL-IP <none>, relancez le patch :"
echo "     kubectl patch svc ingress-nginx-controller -n ingress-nginx --type=merge -p '{\"spec\":{\"type\":\"LoadBalancer\"}}'"
echo ""
echo "3) Fichier hosts :"
echo "   • Navigateur sur Windows : ajoutez dans C:\\Windows\\System32\\drivers\\etc\\hosts :"
echo "       127.0.0.1  task-manager.local"
echo "     (avec le tunnel, l’IP Minikube $IP n’est en général pas joignable depuis Windows.)"
echo "   • curl uniquement dans WSL sans tunnel : vous pouvez garder :"
echo "       ${IP}  task-manager.local"
echo "     dans /etc/hosts sous WSL — mais pour Windows + tunnel, privilégiez 127.0.0.1 ci-dessus."
echo ""
echo "4) Ouvrez : http://task-manager.local"
echo ""
echo "Si http://task-manager.local ne répond pas depuis Windows alors que le tunnel tourne,"
echo "vérifiez dans .wslconfig (Windows) : [wsl2] localhostForwarding=true (Windows 11),"
echo "ou testez le site depuis un navigateur installé dans WSL."
