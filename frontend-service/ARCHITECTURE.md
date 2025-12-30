# Architecture Frontend Service

## Vue d'ensemble

Le frontend-service est une application Next.js 16 qui sert d'interface utilisateur pour le système Biblio Kubernetes. Il communique avec trois services backend via HTTP/REST.

## Architecture Technique

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    (User Interface)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx Ingress                              │
│              (biblio.local routing)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   /           /api/catalog    /api/users
   │              │              │
   ▼              ▼              ▼
┌──────┐    ┌──────────┐   ┌──────────┐
│Frontend│   │Catalog   │   │User      │
│Service │   │Service   │   │Service   │
│:3000   │   │:8080     │   │:8081     │
└────────┘   └──────────┘   └──────────┘
   │
   └──────────► Comment Service :8082
```

## Composants Principaux

### 1. Next.js Application

**Framework**: Next.js 16 avec App Router
**Rendu**: Hybrid (SSR + CSR + Static)
**Langage**: TypeScript

#### Structure des dossiers

```
app/
├── api/              # Server-side API routes
│   ├── health/       # Health check endpoint
│   └── services/     # Backend services status
├── lib/              # Shared utilities
│   ├── api.ts        # API client wrapper
│   └── utils.ts      # Helper functions
├── types/            # TypeScript definitions
├── page.tsx          # Homepage (SSR/Static)
└── layout.tsx        # Root layout
```

### 2. API Layer

#### API Proxy Configuration

Le frontend configure des rewrites dans `next.config.ts` pour proxifier les requêtes:

```typescript
async rewrites() {
  return [
    {
      source: '/api/catalog/:path*',
      destination: 'http://catalog-service:8080/:path*',
    },
    // ... autres services
  ];
}
```

#### API Client Utilities

La couche `lib/api.ts` fournit:
- Gestion des timeouts
- Gestion d'erreurs centralisée
- Support SSR et CSR
- Type safety avec TypeScript

### 3. Communication Services

#### Server-Side Rendering (SSR)

Pour les requêtes côté serveur (getServerSideProps, API routes):

```typescript
// Utilise les noms de service Kubernetes
CATALOG_SERVICE_URL=http://catalog-service:8080
USER_SERVICE_URL=http://user-service:8081
COMMENT_SERVICE_URL=http://comment-service:8082
```

#### Client-Side Rendering (CSR)

Pour les requêtes depuis le navigateur:

```typescript
// Utilise les URLs publiques via Ingress
NEXT_PUBLIC_CATALOG_SERVICE_URL=http://biblio.local/api/catalog
NEXT_PUBLIC_USER_SERVICE_URL=http://biblio.local/api/users
NEXT_PUBLIC_COMMENT_SERVICE_URL=http://biblio.local/api/comments
```

### 4. Patterns de Communication

#### Pattern 1: Direct Backend Call (SSR)

```
Browser → Frontend → Backend Service
         (SSR)      (Kubernetes DNS)
```

Utilisé pour:
- Initial page load
- SEO-critical content
- Data qui nécessite authentication backend

#### Pattern 2: API Route Proxy (CSR)

```
Browser → Frontend API Route → Backend Service
         (Client JS)  (Next.js)    (Kubernetes DNS)
```

Utilisé pour:
- Actions utilisateur interactives
- Opérations CRUD
- Authentication tokens handling

#### Pattern 3: Direct from Browser

```
Browser → Ingress → Backend Service
         (XHR)     (HTTP proxy)
```

Utilisé pour:
- Public read-only data
- Real-time updates
- WebSocket connections (future)

## Déploiement Kubernetes

### Pod Configuration

```yaml
spec:
  containers:
  - name: frontend-service
    image: frontend-service:latest
    ports:
    - containerPort: 3000
    env:
    # Variables pour SSR
    - name: CATALOG_SERVICE_URL
      value: "http://catalog-service:8080"
    # Variables pour CSR
    - name: NEXT_PUBLIC_CATALOG_SERVICE_URL
      value: "http://biblio.local/api/catalog"
```

### Health Checks

#### Liveness Probe

Vérifie que le container est vivant:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 10
```

#### Readiness Probe

Vérifie que le service est prêt à recevoir du trafic:

```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 5
```

### Auto-scaling

Configuration HPA (Horizontal Pod Autoscaler):

```yaml
minReplicas: 2
maxReplicas: 5
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      averageUtilization: 70
- type: Resource
  resource:
    name: memory
    target:
      averageUtilization: 80
```

## Sécurité

### Headers de Sécurité

Configurés dans `next.config.ts`:

```typescript
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
]
```

### Container Security

- ✅ Non-root user (uid: 1001)
- ✅ Read-only filesystem (où possible)
- ✅ Dropped capabilities
- ✅ Security context configuré

### Secrets Management

Les secrets sont injectés via Kubernetes Secrets:

```yaml
env:
- name: NEXTAUTH_SECRET
  valueFrom:
    secretKeyRef:
      name: biblio-secrets
      key: NEXTAUTH_SECRET
```

## Performance

### Optimisations Next.js

1. **Standalone Output**: Build minimal pour Docker
2. **Image Optimization**: Automatic avec Next.js
3. **Code Splitting**: Automatic par route
4. **Static Generation**: Où possible
5. **API Route Caching**: Configuré par endpoint

### Docker Optimizations

1. **Multi-stage Build**: Sépare build et runtime
2. **Layer Caching**: Optimise les rebuilds
3. **Minimal Base Image**: Alpine Linux
4. **Dependencies Pruning**: Seulement production deps

### Kubernetes Optimizations

1. **Resource Limits**: CPU et Memory configurés
2. **HPA**: Scale automatique selon charge
3. **Multiple Replicas**: High availability
4. **Readiness Probes**: Pas de traffic avant ready

## Monitoring

### Métriques Disponibles

1. **Health Status**: `/api/health`
   - Status de l'application
   - Timestamp
   - Version

2. **Services Health**: `/api/services/health`
   - Status de chaque backend
   - URLs de connexion
   - Temps de réponse

### Logs

Les logs sont collectés par Kubernetes:

```bash
# Application logs
kubectl logs -n biblio -l app=frontend-service

# Access logs (via Ingress)
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

## Évolutivité

### Horizontal Scaling

- ✅ Stateless design
- ✅ Pas de session server-side
- ✅ HPA configuré
- ✅ Load balancing automatique

### Vertical Scaling

Ressources configurables:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Dépendances Externes

### Services Backend

1. **Catalog Service** (8080)
   - Recherche de livres
   - Détails des livres
   - OpenLibrary API proxy

2. **User Service** (8081)
   - Gestion utilisateurs
   - Authentication Keycloak
   - Profils

3. **Comment Service** (8082)
   - Commentaires livres
   - Ratings
   - Statistiques

### Services Infrastructure

1. **PostgreSQL** (5432)
   - Session storage
   - User preferences
   - Cache

2. **Keycloak** (8180)
   - SSO Authentication
   - User management
   - OAuth2/OIDC

## Flux de Données

### Lecture de Livre

```
1. User recherche → Frontend
2. Frontend SSR → Catalog Service
3. Catalog Service → OpenLibrary API
4. Response → Catalog → Frontend → User
```

### Ajout de Commentaire

```
1. User submit → Frontend (CSR)
2. Frontend → Comment Service API
3. Comment Service → PostgreSQL
4. Response → Frontend → Update UI
```

### Authentication Flow

```
1. User login → Frontend
2. Frontend → Keycloak (OAuth2)
3. Keycloak → User Service validation
4. Token → Frontend → Store in session
5. Authenticated requests include token
```

## Maintenance

### Mise à jour du Service

```bash
# 1. Build nouvelle image
docker build -t frontend-service:latest .

# 2. Rolling update
kubectl rollout restart deployment/frontend-service -n biblio

# 3. Vérifier le rollout
kubectl rollout status deployment/frontend-service -n biblio
```

### Rollback

```bash
# Revenir à la version précédente
kubectl rollout undo deployment/frontend-service -n biblio
```

### Configuration Update

```bash
# Mettre à jour ConfigMap
kubectl edit configmap biblio-config -n biblio

# Redémarrer pour appliquer
kubectl rollout restart deployment/frontend-service -n biblio
```

## Best Practices

1. ✅ Toujours utiliser TypeScript pour type safety
2. ✅ Séparer SSR et CSR logic clairement
3. ✅ Utiliser l'API proxy pour éviter CORS
4. ✅ Implémenter proper error handling
5. ✅ Logger les erreurs de façon structurée
6. ✅ Tester les health checks régulièrement
7. ✅ Monitorer les métriques de performance
8. ✅ Utiliser environment variables pour config
9. ✅ Versionner les images Docker
10. ✅ Documenter les API endpoints

## Troubleshooting Commun

### Service ne démarre pas

1. Vérifier les logs: `kubectl logs -n biblio <pod>`
2. Vérifier les events: `kubectl describe pod -n biblio <pod>`
3. Vérifier les variables d'env
4. Vérifier la connectivité réseau

### Performance dégradée

1. Vérifier les métriques CPU/Memory
2. Vérifier les logs d'erreur
3. Analyser les temps de réponse des backends
4. Considérer scale up (HPA)

### Erreurs de connexion backend

1. Vérifier que les services backend sont UP
2. Tester avec kubectl exec
3. Vérifier les NetworkPolicies
4. Vérifier les DNS résolution

## Références

- [Next.js Documentation](https://nextjs.org/docs)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Health Check Patterns](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
