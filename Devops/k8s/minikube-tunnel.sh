#!/usr/bin/env bash
# Expose Ingress / LoadBalancer sur la boucle locale (ports 80/443 → souvent sudo sous WSL/Linux).
# À lancer dans un terminal WSL2 dédié et laisser tourner.
#
# Par défaut : sudo minikube tunnel (comportement fiable avec l’Ingress sur 80/443).
# Sans sudo d’abord, Minikube peut démarrer un tunnel incomplet puis redemander sudo — accès Windows cassé.
#
# Désactiver sudo (rare) : ./k8s/minikube-tunnel.sh --no-sudo
#                           ou MINIKUBE_TUNNEL_NO_SUDO=1
#
# Addon ingress en NodePort : patch LoadBalancer (voir k8s/deploy-minikube.sh).
# hosts Windows (souvent) : 127.0.0.1 task-manager.local → http://task-manager.local
set -euo pipefail

echo "==> Minikube tunnel (Ctrl+C pour arrêter)"
echo "    Contrôle : kubectl get svc -n ingress-nginx ingress-nginx-controller"
echo "    EXTERNAL-IP doit apparaître (souvent 127.0.0.1)."
echo ""

if [[ "${1:-}" == "--no-sudo" ]] || [[ "${MINIKUBE_TUNNEL_NO_SUDO:-}" == "1" ]]; then
  echo "==> Mode sans sudo (si les services LoadBalancer n’utilisent pas 80/443, peut suffire)."
  exec minikube tunnel
fi

# --sudo reste accepté pour compatibilité (même chemin que le défaut).
if [[ "${1:-}" == "--sudo" ]]; then
  shift || true
fi

echo "==> sudo minikube tunnel (ports privilégiés 80/443 ; mot de passe demandé une fois)"
exec sudo -E env "PATH=$PATH" "HOME=${HOME}" minikube tunnel "$@"
