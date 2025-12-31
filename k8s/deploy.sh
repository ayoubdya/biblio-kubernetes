#!/bin/bash

# Biblio Kubernetes Deployment Script
# This script deploys the complete Biblio application to a Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="biblio"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Biblio Kubernetes Deployment Script  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}Checking prerequisites...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_status "kubectl is installed"
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    print_status "Connected to Kubernetes cluster"
    
    # Check for NGINX Ingress Controller
    if ! kubectl get ingressclass nginx &> /dev/null; then
        print_warning "NGINX Ingress Controller not found. Installing..."
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
        echo "Waiting for NGINX Ingress Controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=120s
        print_status "NGINX Ingress Controller installed"
    else
        print_status "NGINX Ingress Controller is available"
    fi
}

# Build Docker images
build_images() {
    echo -e "\n${BLUE}Building Docker images...${NC}"
    
    # Catalog Service
    echo "Building catalog-service..."
    docker build -t catalog-service:latest "${SCRIPT_DIR}/../catalog-service" || print_warning "catalog-service build failed"
    
    # User Service
    echo "Building user-service..."
    docker build -t user-service:latest "${SCRIPT_DIR}/../user-service" || print_warning "user-service build failed"
    
    # Comment Service
    echo "Building comment-service..."
    docker build -t comment-service:latest "${SCRIPT_DIR}/../comment-service" || print_warning "comment-service build failed"
    
    # Frontend Service
    echo "Building frontend-service..."
    docker build -t frontend-service:latest "${SCRIPT_DIR}/../frontend-service" || print_warning "frontend-service build failed"
    
    print_status "Docker images built"
}

# Load images to minikube (if using minikube)
load_images_minikube() {
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        echo -e "\n${BLUE}Loading images to Minikube...${NC}"
        minikube image load catalog-service:latest
        echo -e "Loaded catalog-service:latest"
        minikube image load user-service:latest
        echo -e "Loaded user-service:latest"
        minikube image load comment-service:latest
        echo -e "Loaded comment-service:latest"
        minikube image load frontend-service:latest
        echo -e "Loaded frontend-service:latest"
        print_status "Images loaded to Minikube"
    fi
}

# Load images to kind (if using kind)
load_images_kind() {
    if command -v kind &> /dev/null; then
        CLUSTER_NAME=$(kind get clusters 2>/dev/null | head -1)
        if [ -n "$CLUSTER_NAME" ]; then
            echo -e "\n${BLUE}Loading images to Kind cluster: ${CLUSTER_NAME}...${NC}"
            kind load docker-image catalog-service:latest --name "$CLUSTER_NAME"
            kind load docker-image user-service:latest --name "$CLUSTER_NAME"
            kind load docker-image comment-service:latest --name "$CLUSTER_NAME"
            kind load docker-image frontend-service:latest --name "$CLUSTER_NAME"
            print_status "Images loaded to Kind"
        fi
    fi
}

# Create namespace
create_namespace() {
    echo -e "\n${BLUE}Creating namespace...${NC}"
    kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"
    print_status "Namespace '${NAMESPACE}' created"
}

# Deploy core resources
deploy_core() {
    echo -e "\n${BLUE}Deploying core resources...${NC}"
    
    kubectl apply -f "${SCRIPT_DIR}/secrets.yaml"
    print_status "Secrets deployed"
    
    kubectl apply -f "${SCRIPT_DIR}/configmap.yaml"
    print_status "ConfigMaps deployed"
}

# Deploy databases
deploy_databases() {
    echo -e "\n${BLUE}Deploying databases...${NC}"
    
    kubectl apply -f "${SCRIPT_DIR}/postgres-user-db.yaml"
    kubectl apply -f "${SCRIPT_DIR}/postgres-comment-db.yaml"
    
    echo "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l app=user-db -n ${NAMESPACE} --timeout=120s || true
    kubectl wait --for=condition=ready pod -l app=comment-db -n ${NAMESPACE} --timeout=120s || true
    
    print_status "Databases deployed"
}

# Deploy Keycloak
deploy_keycloak() {
    echo -e "\n${BLUE}Deploying Keycloak...${NC}"
    
    kubectl apply -f "${SCRIPT_DIR}/keycloak.yaml"
    
    echo "Waiting for Keycloak to be ready (this may take a few minutes)..."
    kubectl wait --for=condition=ready pod -l app=keycloak -n ${NAMESPACE} --timeout=300s || true
    
    print_status "Keycloak deployed"
}

# Deploy microservices
deploy_microservices() {
    echo -e "\n${BLUE}Deploying microservices...${NC}"
    
    kubectl apply -f "${SCRIPT_DIR}/catalog-service.yaml"
    kubectl apply -f "${SCRIPT_DIR}/user-service.yaml"
    kubectl apply -f "${SCRIPT_DIR}/comment-service.yaml"
    kubectl apply -f "${SCRIPT_DIR}/frontend-service.yaml"
    
    echo "Waiting for microservices to be ready..."
    kubectl wait --for=condition=ready pod -l app=catalog-service -n ${NAMESPACE} --timeout=180s || true
    kubectl wait --for=condition=ready pod -l app=user-service -n ${NAMESPACE} --timeout=180s || true
    kubectl wait --for=condition=ready pod -l app=comment-service -n ${NAMESPACE} --timeout=180s || true
    kubectl wait --for=condition=ready pod -l app=frontend-service -n ${NAMESPACE} --timeout=180s || true
    
    print_status "Microservices deployed"
}

# Deploy monitoring (Prometheus & Grafana)
deploy_monitoring() {
    echo -e "\n${BLUE}Deploying monitoring stack...${NC}"
    
    kubectl apply -f "${SCRIPT_DIR}/prometheus.yaml"
    kubectl apply -f "${SCRIPT_DIR}/grafana.yaml"
    
    echo "Waiting for monitoring to be ready..."
    kubectl wait --for=condition=ready pod -l app=prometheus -n ${NAMESPACE} --timeout=120s || true
    kubectl wait --for=condition=ready pod -l app=grafana -n ${NAMESPACE} --timeout=120s || true
    
    print_status "Monitoring stack deployed"
}

# Deploy Ingress
deploy_ingress() {
    echo -e "\n${BLUE}Deploying Ingress...${NC}"
    
    kubectl apply -f "${SCRIPT_DIR}/ingress.yaml"
    
    print_status "Ingress deployed"
}

# Show deployment status
show_status() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}        Deployment Status               ${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    echo -e "\n${YELLOW}Pods:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}Services:${NC}"
    kubectl get svc -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}PVCs:${NC}"
    kubectl get pvc -n ${NAMESPACE}
}

# Show access information
show_access_info() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}        Access Information              ${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # Get Ingress IP
    INGRESS_IP=$(kubectl get ingress biblio-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    if [ "$INGRESS_IP" == "pending" ] || [ -z "$INGRESS_IP" ]; then
        # Try to get NodePort IP for minikube
        if command -v minikube &> /dev/null && minikube status &> /dev/null; then
            INGRESS_IP=$(minikube ip 2>/dev/null || echo "localhost")
        else
            INGRESS_IP="localhost"
        fi
    fi
    
    echo -e "\n${GREEN}Add the following to your /etc/hosts:${NC}"
    echo -e "  ${INGRESS_IP} biblio.local"
    
    echo -e "\n${GREEN}Access URLs:${NC}"
    echo -e "  Frontend:    http://biblio.local/"
    echo -e "  Catalog API: http://biblio.local/api/catalog/"
    echo -e "  User API:    http://biblio.local/api/users/"
    echo -e "  Comment API: http://biblio.local/api/comments/"
    echo -e "  Keycloak:    http://biblio.local/auth/"
    echo -e "  Prometheus:  http://biblio.local/prometheus/"
    echo -e "  Grafana:     http://biblio.local/grafana/ (admin/admin123)"
    
    echo -e "\n${GREEN}For Minikube users:${NC}"
    echo -e "  Run: minikube tunnel"
    echo -e "  Or use: minikube service list -n ${NAMESPACE}"
}

# Main deployment
main() {
    case "${1:-all}" in
        check)
            check_prerequisites
            ;;
        build)
            build_images
            load_images_minikube
            load_images_kind
            ;;
        core)
            create_namespace
            deploy_core
            ;;
        databases)
            deploy_databases
            ;;
        keycloak)
            deploy_keycloak
            ;;
        microservices)
            deploy_microservices
            ;;
        monitoring)
            deploy_monitoring
            ;;
        ingress)
            deploy_ingress
            ;;
        status)
            show_status
            show_access_info
            ;;
        all)
            # check_prerequisites
            # build_images
            # load_images_minikube
            # load_images_kind
            create_namespace
            deploy_core
            deploy_databases
            deploy_keycloak
            deploy_microservices
            deploy_monitoring
            deploy_ingress
            show_status
            show_access_info
            ;;
        delete)
            echo -e "${YELLOW}Deleting all resources in namespace ${NAMESPACE}...${NC}"
            kubectl delete namespace ${NAMESPACE} --ignore-not-found
            print_status "Namespace ${NAMESPACE} deleted"
            ;;
        *)
            echo "Usage: $0 {all|check|build|core|databases|keycloak|microservices|monitoring|ingress|status|delete}"
            echo ""
            echo "Commands:"
            echo "  all           - Deploy everything (default)"
            echo "  check         - Check prerequisites only"
            echo "  build         - Build and load Docker images"
            echo "  core          - Deploy namespace, secrets, configmaps"
            echo "  databases     - Deploy PostgreSQL databases"
            echo "  keycloak      - Deploy Keycloak"
            echo "  microservices - Deploy all microservices"
            echo "  monitoring    - Deploy Prometheus & Grafana"
            echo "  ingress       - Deploy Ingress resources"
            echo "  status        - Show deployment status"
            echo "  delete        - Delete all resources"
            exit 1
            ;;
    esac
}

main "$@"
