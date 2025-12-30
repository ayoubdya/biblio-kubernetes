# Frontend Service Build and Deploy Script for Windows

param(
    [Parameter(Position=0)]
    [string]$Action = "build"
)

# Configuration
$ServiceName = "frontend-service"
$ImageName = "frontend-service:latest"
$Namespace = "biblio"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Print-Info($message) {
    Write-ColorOutput Green "[INFO] $message"
}

function Print-Warning($message) {
    Write-ColorOutput Yellow "[WARN] $message"
}

function Print-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

Write-Host "========================================"
Write-Host "Frontend Service - Build & Deploy"
Write-Host "========================================"
Write-Host ""

# Check if running with Minikube
$minikubeExists = Get-Command minikube -ErrorAction SilentlyContinue
if ($minikubeExists) {
    Print-Info "Setting up Minikube Docker environment..."
    & minikube -p minikube docker-env --shell powershell | Invoke-Expression
} else {
    Print-Warning "Minikube not found, using local Docker"
}

# Build the Docker image
Print-Info "Building Docker image..."
docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) {
    Print-Error "Docker build failed"
    exit 1
}

Print-Info "Docker image built successfully: $ImageName"

# Execute action
switch ($Action) {
    "deploy" {
        Print-Info "Deploying to Kubernetes..."
        
        kubectl apply -f ..\k8s\namespace.yaml
        kubectl apply -f ..\k8s\secrets.yaml
        kubectl apply -f ..\k8s\configmap.yaml
        kubectl apply -f ..\k8s\postgres-frontend-db.yaml
        kubectl apply -f ..\k8s\frontend-service.yaml
        
        Print-Info "Waiting for deployment to be ready..."
        kubectl rollout status deployment/$ServiceName -n $Namespace --timeout=300s
        if ($LASTEXITCODE -ne 0) {
            Print-Error "Deployment failed"
            kubectl get pods -n $Namespace -l app=$ServiceName
            kubectl logs -n $Namespace -l app=$ServiceName --tail=50
            exit 1
        }
        
        Print-Info "Deployment successful!"
        
        Write-Host ""
        Print-Info "Pod status:"
        kubectl get pods -n $Namespace -l app=$ServiceName
        
        Write-Host ""
        Print-Info "Service information:"
        kubectl get svc -n $Namespace $ServiceName
        
        Write-Host ""
        Print-Info "To access the service locally, run:"
        Write-Host "    kubectl port-forward -n $Namespace service/$ServiceName 3000:3000"
    }
    
    "restart" {
        Print-Info "Restarting deployment..."
        kubectl rollout restart deployment/$ServiceName -n $Namespace
        kubectl rollout status deployment/$ServiceName -n $Namespace --timeout=300s
    }
    
    "logs" {
        Print-Info "Fetching logs..."
        kubectl logs -n $Namespace -l app=$ServiceName --tail=100 -f
    }
    
    "shell" {
        $Pod = kubectl get pods -n $Namespace -l app=$ServiceName -o jsonpath='{.items[0].metadata.name}'
        Print-Info "Opening shell in pod: $Pod"
        kubectl exec -it -n $Namespace $Pod -- /bin/sh
    }
    
    "health" {
        Print-Info "Checking health..."
        $Pod = kubectl get pods -n $Namespace -l app=$ServiceName -o jsonpath='{.items[0].metadata.name}'
        kubectl exec -n $Namespace $Pod -- wget -O- http://localhost:3000/api/health
    }
    
    default {
        Write-Host ""
        Print-Info "Image built. Use one of the following commands:"
        Write-Host ""
        Write-Host "  .\build.ps1 deploy   - Deploy to Kubernetes"
        Write-Host "  .\build.ps1 restart  - Restart the deployment"
        Write-Host "  .\build.ps1 logs     - View logs"
        Write-Host "  .\build.ps1 shell    - Open shell in container"
        Write-Host "  .\build.ps1 health   - Check health status"
        Write-Host ""
        Print-Info "Or run locally with Docker:"
        Write-Host "  docker run -p 3000:3000 --env-file .env.local $ImageName"
    }
}

Write-Host ""
Print-Info "Done!"
