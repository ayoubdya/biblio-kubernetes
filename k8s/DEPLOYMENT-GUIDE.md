# Biblio Kubernetes - Complete Deployment Guide

## Overview

This guide covers deploying the complete Biblio microservices application to Kubernetes, including:

- Microservices (catalog, user, comment, frontend)
- Authentication (Keycloak)
- Databases (PostgreSQL)
- Monitoring (Prometheus + Grafana)
- Logging (Elasticsearch + Logstash + Kibana)

## Quick Start

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh all
```

## Prerequisites

### Required Tools

- `kubectl` - Kubernetes CLI
- `docker` - For building images
- A running Kubernetes cluster

### Supported Cluster Types

- **Minikube** - Local development
- **Kind** - Kubernetes in Docker
- **Docker Desktop** - With Kubernetes enabled
- **Cloud** - EKS, GKE, AKS

## Deployment Options

### Option 1: Automated Deployment Script

```bash
# Full deployment
./deploy.sh all

# Step-by-step deployment
./deploy.sh check        # Verify prerequisites
./deploy.sh build        # Build Docker images
./deploy.sh core         # Deploy namespace, secrets, configmaps
./deploy.sh databases    # Deploy PostgreSQL databases
./deploy.sh keycloak     # Deploy Keycloak authentication
./deploy.sh microservices # Deploy application services
./deploy.sh monitoring   # Deploy Prometheus & Grafana
./deploy.sh elk          # Deploy ELK Stack
./deploy.sh ingress      # Deploy Ingress routing
./deploy.sh status       # View deployment status

# Clean up
./deploy.sh delete
```

### Option 2: Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Deploy configuration
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

# 3. Deploy databases
kubectl apply -f postgres-user-db.yaml
kubectl apply -f postgres-comment-db.yaml
kubectl wait --for=condition=ready pod -l app=user-db -n biblio --timeout=120s
kubectl wait --for=condition=ready pod -l app=comment-db -n biblio --timeout=120s

# 4. Deploy Keycloak
kubectl apply -f keycloak.yaml
kubectl wait --for=condition=ready pod -l app=keycloak -n biblio --timeout=300s

# 5. Deploy microservices
kubectl apply -f catalog-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f comment-service.yaml
kubectl apply -f frontend-service.yaml

# 6. Deploy monitoring
kubectl apply -f prometheus.yaml
kubectl apply -f grafana.yaml

# 7. Deploy ELK Stack
kubectl apply -f elasticsearch.yaml
kubectl wait --for=condition=ready pod -l app=elasticsearch -n biblio --timeout=180s
kubectl apply -f logstash.yaml
kubectl apply -f kibana.yaml

# 8. Deploy Ingress
kubectl apply -f ingress.yaml
```

## Configuration

### Configuring /etc/hosts

Add the following to your `/etc/hosts`:

```
127.0.0.1 biblio.local
```

For Minikube:

```bash
echo "$(minikube ip) biblio.local" | sudo tee -a /etc/hosts
```

### Minikube Setup

```bash
# Enable ingress
minikube addons enable ingress

# Enable tunnel for LoadBalancer services
minikube tunnel
```

### Kind Setup

Images must be loaded into the Kind cluster:

```bash
kind load docker-image catalog-service:latest
kind load docker-image user-service:latest
kind load docker-image comment-service:latest
kind load docker-image frontend-service:latest
```

## Access URLs

| Service     | URL                               | Credentials    |
| ----------- | --------------------------------- | -------------- |
| Frontend    | http://biblio.local/              | -              |
| Catalog API | http://biblio.local/api/catalog/  | -              |
| User API    | http://biblio.local/api/users/    | JWT required   |
| Comment API | http://biblio.local/api/comments/ | JWT required   |
| Keycloak    | http://biblio.local/auth/         | admin/admin    |
| Prometheus  | http://biblio.local/prometheus/   | -              |
| Grafana     | http://biblio.local/grafana/      | admin/admin123 |
| Kibana      | http://biblio.local/kibana/       | -              |

## Files Overview

| File                     | Description                      |
| ------------------------ | -------------------------------- |
| namespace.yaml           | Biblio namespace                 |
| configmap.yaml           | Environment configuration        |
| secrets.yaml             | Sensitive data (passwords, keys) |
| postgres-user-db.yaml    | PostgreSQL for user-service      |
| postgres-comment-db.yaml | PostgreSQL for comment-service   |
| keycloak.yaml            | Keycloak authentication server   |
| catalog-service.yaml     | Catalog microservice             |
| user-service.yaml        | User microservice                |
| comment-service.yaml     | Comment microservice             |
| frontend-service.yaml    | Next.js frontend                 |
| prometheus.yaml          | Prometheus metrics collection    |
| grafana.yaml             | Grafana dashboards               |
| elasticsearch.yaml       | Elasticsearch for log storage    |
| logstash.yaml            | Logstash log processing          |
| kibana.yaml              | Kibana log visualization         |
| ingress.yaml             | NGINX Ingress routing            |
| deploy.sh                | Automated deployment script      |

## Monitoring

### Prometheus

Collects metrics from all Spring Boot services:

- JVM metrics
- HTTP request metrics
- Custom application metrics

### Grafana

Pre-configured dashboards showing:

- Request rates and latencies
- Error rates
- JVM memory and CPU usage
- Database connection pools

### Kibana

View application logs:

1. Access http://biblio.local/kibana/
2. Create index pattern: `biblio-logs-*`
3. Set time field: `@timestamp`

## Scaling

HorizontalPodAutoscaler is configured for each service:

```bash
# View HPA status
kubectl get hpa -n biblio

# Manual scaling
kubectl scale deployment catalog-service --replicas=5 -n biblio
```

## Resource Requirements

| Component     | CPU Request | CPU Limit | Memory Request | Memory Limit |
| ------------- | ----------- | --------- | -------------- | ------------ |
| Microservices | 500m        | 1000m     | 512Mi          | 1Gi          |
| PostgreSQL    | 250m        | 500m      | 256Mi          | 512Mi        |
| Keycloak      | 500m        | 1000m     | 512Mi          | 1Gi          |
| Prometheus    | 250m        | 500m      | 256Mi          | 512Mi        |
| Grafana       | 250m        | 500m      | 256Mi          | 512Mi        |
| Elasticsearch | 500m        | 1000m     | 1Gi            | 2Gi          |
| Logstash      | 250m        | 500m      | 512Mi          | 1Gi          |
| Kibana        | 250m        | 500m      | 512Mi          | 1Gi          |

**Minimum cluster**: 4 CPU cores, 8GB RAM
**Recommended**: 8+ CPU cores, 16GB+ RAM

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n biblio
kubectl describe pod <pod-name> -n biblio
kubectl logs <pod-name> -n biblio -f
```

### Check Services

```bash
kubectl get svc -n biblio
kubectl get ingress -n biblio
kubectl get endpoints -n biblio
```

### Common Issues

1. **Pods stuck in Pending**: Check node resources

   ```bash
   kubectl describe nodes
   ```

2. **CrashLoopBackOff**: Check logs

   ```bash
   kubectl logs <pod-name> -n biblio --previous
   ```

3. **Ingress not working**: Verify Ingress Controller

   ```bash
   kubectl get pods -n ingress-nginx
   ```

4. **Database connection issues**: Check secrets
   ```bash
   kubectl get secret biblio-secrets -n biblio -o yaml
   ```

## Security Recommendations

For production deployments:

1. **Change default passwords** in `secrets.yaml`
2. **Enable TLS** in Ingress
3. **Use Sealed Secrets** or HashiCorp Vault
4. **Enable Network Policies**
5. **Configure RBAC** properly
6. **Enable Pod Security Standards**

## Cleanup

```bash
# Delete all resources
./deploy.sh delete

# Or manually
kubectl delete namespace biblio
```
