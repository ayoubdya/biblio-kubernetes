# Frontend Service - Biblio Kubernetes

Application frontend Next.js 16 pour le système de gestion de bibliothèque.

## 🚀 Fonctionnalités

- ✅ **Next.js 16** avec App Router et React 19
- ✅ **TypeScript** pour un code type-safe
- ✅ **Tailwind CSS** pour le styling moderne
- ✅ **API Proxy** vers les services backend
- ✅ **Health Checks** pour monitoring
- ✅ **Docker** avec build multi-stage optimisé
- ✅ **Kubernetes Ready** avec HPA et liveness/readiness probes
- ✅ **Security Headers** configurés
- ✅ **Non-root User** dans le container

## 📋 Prérequis

- Node.js 20+
- npm ou yarn
- Docker (pour la containerisation)
- Kubectl et Minikube (pour Kubernetes)

## 🛠️ Installation

### Installation des dépendances

```bash
npm install
```

### Configuration des variables d'environnement

Créez un fichier `.env.local` à partir de l'exemple:

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` avec vos configurations:

```env
# Database
DATABASE_URL=postgresql://admin:admin123@localhost:5433/biblio-kubernetes

# NextAuth
NEXTAUTH_SECRET=your-secret-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Backend Services (Server-side)
CATALOG_SERVICE_URL=http://localhost:8080
USER_SERVICE_URL=http://localhost:8081
COMMENT_SERVICE_URL=http://localhost:8082

# Public URLs (Client-side)
NEXT_PUBLIC_CATALOG_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_COMMENT_SERVICE_URL=http://localhost:8082

# Keycloak
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8180/auth
NEXT_PUBLIC_KEYCLOAK_REALM=biblio
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=frontend-client
```

## 🏃 Développement Local

### Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de production

```bash
npm run build
npm start
```

## 🐳 Docker

### Build de l'image

```bash
docker build -t frontend-service:latest .
```

### Exécuter le container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://admin:admin123@host.docker.internal:5433/biblio-kubernetes \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e CATALOG_SERVICE_URL=http://host.docker.internal:8080 \
  -e USER_SERVICE_URL=http://host.docker.internal:8081 \
  -e COMMENT_SERVICE_URL=http://host.docker.internal:8082 \
  frontend-service:latest
```

## ☸️ Kubernetes

### Déploiement avec scripts

#### Windows (PowerShell)

```powershell
# Build et déployer
.\build.ps1 deploy

# Redémarrer le déploiement
.\build.ps1 restart

# Voir les logs
.\build.ps1 logs

# Shell dans le container
.\build.ps1 shell

# Vérifier la santé
.\build.ps1 health
```

#### Linux/Mac (Bash)

```bash
# Build et déployer
./build.sh deploy

# Redémarrer le déploiement
./build.sh restart

# Voir les logs
./build.sh logs

# Shell dans le container
./build.sh shell

# Vérifier la santé
./build.sh health
```

### Déploiement manuel

```bash
# Configurer l'environnement Minikube
eval $(minikube docker-env)

# Build l'image
docker build -t frontend-service:latest .

# Déployer sur Kubernetes
kubectl apply -f ../k8s/namespace.yaml
kubectl apply -f ../k8s/secrets.yaml
kubectl apply -f ../k8s/configmap.yaml
kubectl apply -f ../k8s/postgres-frontend-db.yaml
kubectl apply -f ../k8s/frontend-service.yaml

# Vérifier le statut
kubectl get pods -n biblio -l app=frontend-service

# Port forwarding pour accès local
kubectl port-forward -n biblio service/frontend-service 3000:3000
```

## 🔍 API Routes

### Health Checks

- **GET /api/health** - Health check de l'application
  ```bash
  curl http://localhost:3000/api/health
  ```

- **GET /api/services/health** - Statut de tous les services backend
  ```bash
  curl http://localhost:3000/api/services/health
  ```

### API Proxy

Le frontend sert de proxy pour les services backend:

- `/api/catalog/*` → Catalog Service (port 8080)
- `/api/users/*` → User Service (port 8081)
- `/api/comments/*` → Comment Service (port 8082)

## 🏗️ Structure du Projet

```
frontend-service/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── health/              # Health check endpoint
│   │   └── services/health/     # Services health check
│   ├── lib/                      # Utilities
│   │   ├── api.ts               # API client functions
│   │   └── utils.ts             # Helper functions
│   ├── types/                    # TypeScript types
│   │   └── index.ts             # Type definitions
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
├── public/                       # Static assets
├── .dockerignore                # Docker ignore rules
├── .env.local.example           # Example environment variables
├── build.ps1                     # Windows build script
├── build.sh                      # Linux/Mac build script
├── DEPLOYMENT.md                # Deployment guide
├── Dockerfile                    # Docker configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
├── postcss.config.mjs           # PostCSS configuration
├── README.md                    # This file
└── tsconfig.json                # TypeScript configuration
```

## 🔧 Configuration

### Next.js Configuration

Le fichier [next.config.ts](next.config.ts) configure:
- **Standalone Output**: Pour Docker
- **API Rewrites**: Proxy vers les services backend
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.

### Dockerfile

Le [Dockerfile](Dockerfile) utilise:
- **Multi-stage Build**: Optimisation de la taille
- **Non-root User**: Sécurité renforcée
- **Health Check**: Monitoring intégré
- **Standalone Output**: Build minimal

## 🔌 Communication avec les Services

### Server-Side (SSR/API Routes)

Utilise les URLs internes Kubernetes:
```typescript
CATALOG_SERVICE_URL=http://catalog-service:8080
USER_SERVICE_URL=http://user-service:8081
COMMENT_SERVICE_URL=http://comment-service:8082
```

### Client-Side (Browser)

Utilise les URLs publiques via Ingress:
```typescript
NEXT_PUBLIC_CATALOG_SERVICE_URL=http://biblio.local/api/catalog
NEXT_PUBLIC_USER_SERVICE_URL=http://biblio.local/api/users
NEXT_PUBLIC_COMMENT_SERVICE_URL=http://biblio.local/api/comments
```

## 📊 Monitoring et Logs

### Kubernetes Logs

```bash
# Voir tous les logs
kubectl logs -n biblio -l app=frontend-service

# Suivre les logs en temps réel
kubectl logs -n biblio -l app=frontend-service -f

# Logs d'un pod spécifique
kubectl logs -n biblio <pod-name>
```

### Health Checks

```bash
# Dans Kubernetes
kubectl exec -n biblio <pod-name> -- wget -O- http://localhost:3000/api/health

# Via port-forward
curl http://localhost:3000/api/health
curl http://localhost:3000/api/services/health
```

## 🚨 Dépannage

### Le container ne démarre pas

1. Vérifier les logs:
   ```bash
   kubectl logs -n biblio -l app=frontend-service
   ```

2. Vérifier les variables d'environnement:
   ```bash
   kubectl describe pod -n biblio <pod-name>
   ```

3. Vérifier que la base de données est accessible

### Health check échoue

1. Vérifier que le service écoute sur le port 3000
2. Tester l'endpoint `/api/health` manuellement
3. Vérifier les logs du container

### Impossible de se connecter aux services backend

1. Vérifier que les services backend sont running:
   ```bash
   kubectl get pods -n biblio
   ```

2. Vérifier les noms de service dans `next.config.ts`

3. Tester la connectivité réseau:
   ```bash
   kubectl exec -n biblio <frontend-pod> -- wget -O- http://catalog-service:8080/actuator/health
   ```

## 📝 Développement

### Ajouter une nouvelle page

Créez un fichier dans `app/`:
```tsx
// app/books/page.tsx
export default function BooksPage() {
  return <div>Books Page</div>;
}
```

### Ajouter une API route

Créez un fichier dans `app/api/`:
```tsx
// app/api/books/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ books: [] });
}
```

### Utiliser le client API

```tsx
import { apiGet, apiPost } from '@/app/lib/api';

// GET request
const books = await apiGet('catalog', '/api/books');

// POST request
const newBook = await apiPost('catalog', '/api/books', {
  title: 'New Book',
  author: 'Author Name'
});
```

## 🔐 Sécurité

- ✅ Security headers configurés (X-Frame-Options, etc.)
- ✅ Container run en tant que non-root user
- ✅ HTTPS ready (via Ingress)
- ✅ Environment variables pour secrets
- ✅ CORS configuré

## 📦 Technologies Utilisées

- **Next.js 16** - Framework React
- **React 19** - Library UI
- **TypeScript 5** - Langage type-safe
- **Tailwind CSS 4** - Framework CSS
- **Docker** - Containerisation
- **Kubernetes** - Orchestration

## 📄 License

Ce projet fait partie du système Biblio Kubernetes.

## 📚 Documentation Supplémentaire

- [DEPLOYMENT.md](DEPLOYMENT.md) - Guide de déploiement détaillé
- [Next.js Documentation](https://nextjs.org/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

