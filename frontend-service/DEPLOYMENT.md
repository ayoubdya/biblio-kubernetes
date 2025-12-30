# Frontend Service Development

## Environment Variables

Create a `.env.local` file for local development:

```env
# Database
DATABASE_URL=postgresql://admin:admin123@localhost:5433/biblio-kubernetes

# NextAuth
NEXTAUTH_SECRET=your-secret-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Internal Service URLs (Server-side)
CATALOG_SERVICE_URL=http://localhost:8080
USER_SERVICE_URL=http://localhost:8081
COMMENT_SERVICE_URL=http://localhost:8082

# Public Service URLs (Client-side)
NEXT_PUBLIC_CATALOG_SERVICE_URL=http://localhost:8080
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_COMMENT_SERVICE_URL=http://localhost:8082

# Keycloak
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8180/auth
NEXT_PUBLIC_KEYCLOAK_REALM=biblio
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=frontend-client
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Docker Build

```bash
# Build the image
docker build -t frontend-service:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://admin:admin123@host.docker.internal:5433/biblio-kubernetes \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e CATALOG_SERVICE_URL=http://host.docker.internal:8080 \
  -e USER_SERVICE_URL=http://host.docker.internal:8081 \
  -e COMMENT_SERVICE_URL=http://host.docker.internal:8082 \
  frontend-service:latest
```

## Kubernetes Deployment

```bash
# Build and load image to Minikube
eval $(minikube docker-env)
docker build -t frontend-service:latest .

# Apply Kubernetes configuration
kubectl apply -f ../k8s/frontend-service.yaml

# Check status
kubectl get pods -n biblio -l app=frontend-service
kubectl logs -n biblio -l app=frontend-service

# Port forward for testing
kubectl port-forward -n biblio service/frontend-service 3000:3000
```

## API Routes

- **GET /api/health** - Health check endpoint
- **GET /api/services/health** - Check all backend services health

## Features

- ✅ Next.js 16 with App Router
- ✅ TypeScript support
- ✅ Tailwind CSS for styling
- ✅ API proxy to backend services
- ✅ Health check endpoints
- ✅ Docker support with multi-stage build
- ✅ Kubernetes ready
- ✅ Auto-scaling with HPA
- ✅ Security headers
- ✅ Non-root user in container

## Service Communication

The frontend communicates with backend services in two ways:

1. **Server-side (SSR/API Routes)**: Uses internal Kubernetes service names
   - `CATALOG_SERVICE_URL=http://catalog-service:8080`
   - `USER_SERVICE_URL=http://user-service:8081`
   - `COMMENT_SERVICE_URL=http://comment-service:8082`

2. **Client-side (Browser)**: Uses public URLs through Ingress
   - `NEXT_PUBLIC_CATALOG_SERVICE_URL=http://biblio.local/api/catalog`
   - `NEXT_PUBLIC_USER_SERVICE_URL=http://biblio.local/api/users`
   - `NEXT_PUBLIC_COMMENT_SERVICE_URL=http://biblio.local/api/comments`

## Testing Health Checks

```bash
# Local health check
curl http://localhost:3000/api/health

# Services health check
curl http://localhost:3000/api/services/health

# In Kubernetes
kubectl exec -n biblio -it <pod-name> -- wget -O- http://localhost:3000/api/health
```

## Troubleshooting

### Container won't start
- Check logs: `kubectl logs -n biblio -l app=frontend-service`
- Verify environment variables are set
- Ensure database is accessible

### Health check fails
- Verify the service is listening on port 3000
- Check that `/api/health` endpoint is accessible
- Review container logs for errors

### Cannot connect to backend services
- Verify service names in `next.config.ts`
- Check that backend services are running
- Ensure network policies allow communication
