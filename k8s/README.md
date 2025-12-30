# Kubernetes Deployment Guide - Biblio Project

## 📋 Prérequis

- **Kubernetes cluster** (Minikube, Kind, Docker Desktop, ou cluster cloud)
- **kubectl** installé et configuré
- **Docker** pour construire les images
- **Ingress Controller** (nginx-ingress recommandé)

## 🏗️ Architecture des fichiers

```
k8s/
├── namespace.yaml              # Namespace "biblio"
├── configmap.yaml              # Configuration commune
├── secrets.yaml                # Secrets (DB, Keycloak)
├── postgres-user-db.yaml       # Base de données users
├── postgres-comment-db.yaml    # Base de données comments
├── postgres-frontend-db.yaml   # Base de données frontend
├── catalog-service.yaml        # Service catalogue (port 8080)
├── user-service.yaml           # Service users (port 8081)
├── comment-service.yaml        # Service comments (port 8082)
├── frontend-service.yaml       # Frontend Next.js (port 3000)
└── ingress.yaml                # Routage externe
```

## 🚀 Étapes de déploiement

### 1. Construire les images Docker

```bash
# Catalog Service
cd catalog-service
docker build -t catalog-service:latest .

# User Service
cd ../user-service
docker build -t user-service:latest .

# Comment Service
cd ../comment-service
docker build -t comment-service:latest .

# Frontend Service
cd ../frontend-service
docker build -t frontend-service:latest .
```

### 2. (Optionnel) Pousser les images vers un registry

Si vous utilisez un registry privé ou Docker Hub :

```bash
# Tag et push
docker tag catalog-service:latest yourregistry/catalog-service:latest
docker push yourregistry/catalog-service:latest

# Répéter pour tous les services
```

### 3. Créer le namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 4. Créer les secrets et ConfigMaps

**IMPORTANT**: Modifier [secrets.yaml](secrets.yaml) avec vos vraies valeurs avant le déploiement en production!

```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
```

### 5. Déployer les bases de données

```bash
kubectl apply -f k8s/postgres-user-db.yaml
kubectl apply -f k8s/postgres-comment-db.yaml
kubectl apply -f k8s/postgres-frontend-db.yaml

# Vérifier que les DBs sont prêtes
kubectl get pods -n biblio -w
```

### 6. Déployer les services backend

```bash
kubectl apply -f k8s/catalog-service.yaml
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/comment-service.yaml

# Vérifier les services
kubectl get pods -n biblio
kubectl get svc -n biblio
```

### 7. Déployer le frontend

```bash
kubectl apply -f k8s/frontend-service.yaml
```

### 8. Configurer l'Ingress

```bash
# Installer nginx-ingress si nécessaire
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Appliquer l'ingress
kubectl apply -f k8s/ingress.yaml

# Ajouter à /etc/hosts (ou C:\Windows\System32\drivers\etc\hosts sur Windows)
127.0.0.1 biblio.local
```

## ✅ Vérification du déploiement

```bash
# Voir tous les pods
kubectl get pods -n biblio

# Voir tous les services
kubectl get svc -n biblio

# Voir les logs d'un service
kubectl logs -f deployment/catalog-service -n biblio

# Voir l'état de l'ingress
kubectl get ingress -n biblio

# Port-forward pour tester (si pas d'ingress)
kubectl port-forward svc/frontend-service 3000:3000 -n biblio
```

## 🔍 Commandes utiles

### Surveillance

```bash
# Dashboard général
kubectl get all -n biblio

# Monitoring des ressources
kubectl top pods -n biblio
kubectl top nodes

# Événements
kubectl get events -n biblio --sort-by='.lastTimestamp'
```

### Debug

```bash
# Shell dans un pod
kubectl exec -it <pod-name> -n biblio -- /bin/sh

# Logs avec suivi
kubectl logs -f <pod-name> -n biblio

# Décrire un pod
kubectl describe pod <pod-name> -n biblio

# Tester la connectivité entre services
kubectl run test-pod --rm -it --image=busybox -n biblio -- sh
# Dans le pod:
wget -O- http://catalog-service:8080/actuator/health
```

### Mise à jour

```bash
# Mettre à jour une image
kubectl set image deployment/catalog-service catalog-service=catalog-service:v2 -n biblio

# Rollback
kubectl rollout undo deployment/catalog-service -n biblio

# Historique des déploiements
kubectl rollout history deployment/catalog-service -n biblio
```

### Scaling manuel

```bash
# Scaler un service
kubectl scale deployment catalog-service --replicas=5 -n biblio

# HPA (Horizontal Pod Autoscaler) est déjà configuré automatiquement
kubectl get hpa -n biblio
```

## 🌐 Accès aux services

Après le déploiement avec succès :

- **Frontend**: http://biblio.local
- **Catalog API**: http://biblio.local/api/catalog
- **User API**: http://biblio.local/api/users
- **Comment API**: http://biblio.local/api/comments

## 🔒 Sécurité en production

### 1. Secrets

Ne jamais commiter [secrets.yaml](secrets.yaml) avec de vraies valeurs!

Utiliser plutôt:

```bash
# Créer un secret depuis la ligne de commande
kubectl create secret generic biblio-secrets \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=super-secure-password \
  -n biblio

# Ou utiliser Sealed Secrets / External Secrets Operator
```

### 2. RBAC

Créer des rôles et permissions appropriés:

```bash
kubectl create serviceaccount biblio-sa -n biblio
# Créer des RoleBindings appropriés
```

### 3. Network Policies

Limiter la communication entre pods:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-services
  namespace: biblio
spec:
  podSelector:
    matchLabels:
      app: frontend-service
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: catalog-service
    - podSelector:
        matchLabels:
          app: user-service
    - podSelector:
        matchLabels:
          app: comment-service
```

## 🔄 CI/CD

Exemple avec GitHub Actions:

```yaml
name: Deploy to Kubernetes
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: |
          docker build -t myregistry/catalog-service:${{ github.sha }} catalog-service/
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/catalog-service catalog-service=myregistry/catalog-service:${{ github.sha }} -n biblio
```

## 📊 Monitoring avec Prometheus

Les services exposent déjà des métriques sur `/actuator/prometheus`.

```bash
# Installer Prometheus Operator
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

# Créer un ServiceMonitor
kubectl apply -f k8s/monitoring/servicemonitor.yaml
```

## 🧹 Nettoyage

```bash
# Supprimer tous les déploiements
kubectl delete -f k8s/ --recursive

# Ou supprimer le namespace entier
kubectl delete namespace biblio
```

## 📝 Notes

- Les **PersistentVolumeClaims** conservent les données même si les pods sont supprimés
- Les **HPA** (Horizontal Pod Autoscalers) sont configurés pour scaling automatique 2-5 replicas
- Les **health checks** (liveness/readiness) permettent le self-healing automatique
- Les **resource limits** évitent qu'un service monopolise toutes les ressources

## 🆘 Troubleshooting

### Pod en CrashLoopBackOff

```bash
kubectl logs <pod-name> -n biblio --previous
kubectl describe pod <pod-name> -n biblio
```

### Service non accessible

```bash
# Vérifier les endpoints
kubectl get endpoints -n biblio

# Tester depuis un pod
kubectl run -it --rm debug --image=curlimages/curl -n biblio -- sh
curl http://catalog-service:8080/actuator/health
```

### Base de données non prête

```bash
# Vérifier les logs PostgreSQL
kubectl logs <postgres-pod> -n biblio

# Vérifier le PVC
kubectl get pvc -n biblio
```
