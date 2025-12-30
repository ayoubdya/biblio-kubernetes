#!/bin/bash

# Frontend Service Build and Deploy Script

set -e

echo "========================================"
echo "Frontend Service - Build & Deploy"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="frontend-service"
IMAGE_NAME="frontend-service:latest"
NAMESPACE="biblio"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in Minikube
if command -v minikube &> /dev/null; then
    print_info "Setting up Minikube Docker environment..."
    eval $(minikube docker-env)
else
    print_warning "Minikube not found, using local Docker"
fi

# Build the Docker image
print_info "Building Docker image..."
docker build -t $IMAGE_NAME . || {
    print_error "Docker build failed"
    exit 1
}

print_info "Docker image built successfully: $IMAGE_NAME"

# Check if we're deploying to Kubernetes
if [ "$1" == "deploy" ]; then
    print_info "Deploying to Kubernetes..."
    
    # Apply the Kubernetes configuration
    kubectl apply -f ../k8s/namespace.yaml
    kubectl apply -f ../k8s/secrets.yaml
    kubectl apply -f ../k8s/configmap.yaml
    kubectl apply -f ../k8s/postgres-frontend-db.yaml
    kubectl apply -f ../k8s/frontend-service.yaml
    
    print_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE --timeout=300s || {
        print_error "Deployment failed"
        kubectl get pods -n $NAMESPACE -l app=$SERVICE_NAME
        kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME --tail=50
        exit 1
    }
    
    print_info "Deployment successful!"
    
    # Show pod status
    echo ""
    print_info "Pod status:"
    kubectl get pods -n $NAMESPACE -l app=$SERVICE_NAME
    
    # Show service information
    echo ""
    print_info "Service information:"
    kubectl get svc -n $NAMESPACE $SERVICE_NAME
    
    echo ""
    print_info "To access the service locally, run:"
    echo "    kubectl port-forward -n $NAMESPACE service/$SERVICE_NAME 3000:3000"
    
elif [ "$1" == "restart" ]; then
    print_info "Restarting deployment..."
    kubectl rollout restart deployment/$SERVICE_NAME -n $NAMESPACE
    kubectl rollout status deployment/$SERVICE_NAME -n $NAMESPACE --timeout=300s
    
elif [ "$1" == "logs" ]; then
    print_info "Fetching logs..."
    kubectl logs -n $NAMESPACE -l app=$SERVICE_NAME --tail=100 -f
    
elif [ "$1" == "shell" ]; then
    POD=$(kubectl get pods -n $NAMESPACE -l app=$SERVICE_NAME -o jsonpath='{.items[0].metadata.name}')
    print_info "Opening shell in pod: $POD"
    kubectl exec -it -n $NAMESPACE $POD -- /bin/sh
    
elif [ "$1" == "health" ]; then
    print_info "Checking health..."
    POD=$(kubectl get pods -n $NAMESPACE -l app=$SERVICE_NAME -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -n $NAMESPACE $POD -- wget -O- http://localhost:3000/api/health
    
else
    echo ""
    print_info "Image built. Use one of the following commands:"
    echo ""
    echo "  ./build.sh deploy   - Deploy to Kubernetes"
    echo "  ./build.sh restart  - Restart the deployment"
    echo "  ./build.sh logs     - View logs"
    echo "  ./build.sh shell    - Open shell in container"
    echo "  ./build.sh health   - Check health status"
    echo ""
    print_info "Or run locally with Docker:"
    echo "  docker run -p 3000:3000 --env-file .env.local $IMAGE_NAME"
fi

echo ""
print_info "Done!"
