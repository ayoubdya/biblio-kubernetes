# ==========================================
# SCRIPT COMPLET - Kubernetes Biblio App
# Build + Deploy + Monitor en UN SEUL SCRIPT
# ==========================================

param(
    [switch]$SkipBuild,
    [switch]$SkipDeploy,
    [string]$Namespace = "biblio"
)

$ErrorActionPreference = "Continue"

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "       DEPLOIEMENT COMPLET KUBERNETES               " -ForegroundColor Cyan
Write-Host "       Biblio Application                           " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# ==========================================
# PHASE 1: VERIFICATION
# ==========================================
Write-Host "`n[PHASE 1/4] VERIFICATION DE L'ENVIRONNEMENT" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray

# Verifier kubectl
Write-Host "   Verification kubectl..." -ForegroundColor Yellow
try {
    kubectl version --client --short 2>$null | Out-Null
    Write-Host "   [OK] kubectl installe" -ForegroundColor Green
} catch {
    Write-Host "   [ERREUR] kubectl non trouve" -ForegroundColor Red
    exit 1
}

# Verifier cluster
Write-Host "   Verification cluster Kubernetes..." -ForegroundColor Yellow
try {
    kubectl cluster-info 2>$null | Out-Null
    Write-Host "   [OK] Cluster connecte" -ForegroundColor Green
} catch {
    Write-Host "   [ERREUR] Cluster non accessible" -ForegroundColor Red
    exit 1
}

# Verifier Docker
Write-Host "   Verification Docker..." -ForegroundColor Yellow
try {
    docker version 2>$null | Out-Null
    Write-Host "   [OK] Docker operationnel" -ForegroundColor Green
} catch {
    Write-Host "   [ERREUR] Docker non trouve" -ForegroundColor Red
    exit 1
}

# ==========================================
# PHASE 2: BUILD DES IMAGES DOCKER
# ==========================================
if (-not $SkipBuild) {
    Write-Host "`n[PHASE 2/4] CONSTRUCTION DES IMAGES DOCKER" -ForegroundColor Green
    Write-Host "-"*60 -ForegroundColor Gray
    
    $rootPath = Split-Path -Parent $PSScriptRoot
    Set-Location $rootPath
    
    # Build user-service
    Write-Host "`n   [1/4] Build user-service..." -ForegroundColor Yellow
    Set-Location "$rootPath\user-service"
    docker build -t user-service:latest . 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] user-service image creee" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec build user-service" -ForegroundColor Red
    }
    
    # Build catalog-service
    Write-Host "   [2/4] Build catalog-service..." -ForegroundColor Yellow
    Set-Location "$rootPath\catalog-service"
    docker build -t catalog-service:latest . 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] catalog-service image creee" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec build catalog-service" -ForegroundColor Red
    }
    
    # Build comment-service
    Write-Host "   [3/4] Build comment-service..." -ForegroundColor Yellow
    Set-Location "$rootPath\comment-service"
    docker build -t comment-service:latest . 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] comment-service image creee" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec build comment-service" -ForegroundColor Red
    }
    
    # Build frontend-service
    Write-Host "   [4/4] Build frontend-service..." -ForegroundColor Yellow
    Set-Location "$rootPath\frontend-service"
    docker build -t frontend-service:latest . 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] frontend-service image creee" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec build frontend-service" -ForegroundColor Red
    }
    
    Write-Host "`n   [INFO] Verification des images Docker..." -ForegroundColor Cyan
    docker images | Select-String "user-service|catalog-service|comment-service|frontend-service"
    
    Set-Location "$rootPath\k8s"
} else {
    Write-Host "`n[PHASE 2/4] CONSTRUCTION DES IMAGES (SKIP)" -ForegroundColor Yellow
}

# ==========================================
# PHASE 3: DEPLOIEMENT KUBERNETES
# ==========================================
if (-not $SkipDeploy) {
    Write-Host "`n[PHASE 3/4] DEPLOIEMENT KUBERNETES" -ForegroundColor Green
    Write-Host "-"*60 -ForegroundColor Gray
    
    # Etape 1: Namespace
    Write-Host "`n   [1/8] Creation namespace '$Namespace'..." -ForegroundColor Yellow
    kubectl apply -f namespace.yaml 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Namespace cree" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec creation namespace" -ForegroundColor Red
        exit 1
    }
    
    # Etape 2: Secrets
    Write-Host "   [2/8] Creation secrets..." -ForegroundColor Yellow
    kubectl apply -f secrets.yaml 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Secrets crees" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec creation secrets" -ForegroundColor Red
        exit 1
    }
    
    # Etape 3: ConfigMaps
    Write-Host "   [3/8] Creation ConfigMaps..." -ForegroundColor Yellow
    kubectl apply -f configmap.yaml 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] ConfigMaps crees" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec creation ConfigMaps" -ForegroundColor Red
        exit 1
    }
    
    # Etape 4: Bases de donnees PostgreSQL
    Write-Host "   [4/8] Deploiement bases de donnees..." -ForegroundColor Yellow
    kubectl apply -f postgres-user-db.yaml 2>&1 | Out-Null
    kubectl apply -f postgres-comment-db.yaml 2>&1 | Out-Null
    kubectl apply -f postgres-frontend-db.yaml 2>&1 | Out-Null
    
    Write-Host "   [INFO] Attente initialisation bases de donnees (30s)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
    
    $dbReady = 0
    $maxWait = 6
    for ($i = 1; $i -le $maxWait; $i++) {
        $runningPods = (kubectl get pods -n $Namespace -l "app in (user-db,comment-db,frontend-db)" --field-selector=status.phase=Running --no-headers 2>$null | Measure-Object).Count
        Write-Host "   [INFO] Pods DB Running: $runningPods/3 (tentative $i/$maxWait)" -ForegroundColor Gray
        if ($runningPods -eq 3) {
            $dbReady = 3
            break
        }
        Start-Sleep -Seconds 10
    }
    
    if ($dbReady -eq 3) {
        Write-Host "   [OK] Bases de donnees pretes" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Timeout bases de donnees ($dbReady/3 pretes)" -ForegroundColor Yellow
        Write-Host "   [INFO] On continue quand meme..." -ForegroundColor Cyan
    }
    
    # Etape 5: Microservices backend
    Write-Host "   [5/8] Deploiement microservices..." -ForegroundColor Yellow
    kubectl apply -f user-service.yaml 2>&1 | Out-Null
    kubectl apply -f catalog-service.yaml 2>&1 | Out-Null
    kubectl apply -f comment-service.yaml 2>&1 | Out-Null
    Write-Host "   [OK] Microservices deployes" -ForegroundColor Green
    
    # Etape 6: Frontend
    Write-Host "   [6/8] Deploiement frontend..." -ForegroundColor Yellow
    kubectl apply -f frontend-service.yaml 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Frontend deploye" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Echec deploiement frontend" -ForegroundColor Red
    }
    
    # Etape 7: Ingress
    Write-Host "   [7/8] Deploiement Ingress..." -ForegroundColor Yellow
    if (Test-Path "ingress.yaml") {
        kubectl apply -f ingress.yaml 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Ingress deploye" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Ingress non deploye (ignore)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [WARN] ingress.yaml introuvable (ignore)" -ForegroundColor Yellow
    }
    
    # Etape 8: Attente stabilisation
    Write-Host "   [8/8] Attente stabilisation (20s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20
    Write-Host "   [OK] Deploiement termine" -ForegroundColor Green
    
} else {
    Write-Host "`n[PHASE 3/4] DEPLOIEMENT KUBERNETES (SKIP)" -ForegroundColor Yellow
}

# ==========================================
# PHASE 4: MONITORING ET STATUT
# ==========================================
Write-Host "`n[PHASE 4/4] MONITORING ET STATUT" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray

# Pods
Write-Host "`n[PODS] Status des Pods" -ForegroundColor Cyan
kubectl get pods -n $Namespace -o wide

# Services
Write-Host "`n[SERVICES] Points d'acces reseau" -ForegroundColor Cyan
kubectl get svc -n $Namespace

# Deployments
Write-Host "`n[DEPLOYMENTS] Gestion des replicas" -ForegroundColor Cyan
kubectl get deployments -n $Namespace

# PVC
Write-Host "`n[PVC] Stockage persistant" -ForegroundColor Cyan
kubectl get pvc -n $Namespace

# ConfigMaps
Write-Host "`n[CONFIGMAPS] Configuration" -ForegroundColor Cyan
kubectl get configmap -n $Namespace | Select-Object -First 10

# Secrets
Write-Host "`n[SECRETS] Donnees sensibles" -ForegroundColor Cyan
kubectl get secrets -n $Namespace

# Events recents
Write-Host "`n[EVENTS] Evenements recents" -ForegroundColor Cyan
kubectl get events -n $Namespace --sort-by='.lastTimestamp' | Select-Object -Last 10

# Resume
Write-Host "`n[SUMMARY] Resume des ressources" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray

$pods = kubectl get pods -n $Namespace --no-headers 2>$null
$podCount = ($pods | Measure-Object).Count
$runningPods = ($pods | Where-Object { $_ -match "Running" } | Measure-Object).Count
$pendingPods = ($pods | Where-Object { $_ -match "Pending" } | Measure-Object).Count
$failedPods = ($pods | Where-Object { $_ -match "Error|CrashLoop|ImagePull" } | Measure-Object).Count

$svcCount = (kubectl get svc -n $Namespace --no-headers 2>$null | Measure-Object).Count
$deployCount = (kubectl get deployments -n $Namespace --no-headers 2>$null | Measure-Object).Count
$pvcCount = (kubectl get pvc -n $Namespace --no-headers 2>$null | Measure-Object).Count

Write-Host "   Total Pods:       $podCount" -ForegroundColor White
Write-Host "   - Running:        $runningPods" -ForegroundColor Green
Write-Host "   - Pending:        $pendingPods" -ForegroundColor Yellow
Write-Host "   - Failed:         $failedPods" -ForegroundColor Red
Write-Host "   Services:         $svcCount" -ForegroundColor White
Write-Host "   Deployments:      $deployCount" -ForegroundColor White
Write-Host "   PVCs:             $pvcCount" -ForegroundColor White

# ==========================================
# COMMANDES UTILES
# ==========================================
Write-Host "`n[COMMANDS] Commandes utiles" -ForegroundColor Cyan
Write-Host "-"*60 -ForegroundColor Gray
Write-Host "   Logs d'un pod:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n $Namespace POD-NAME --tail=50 -f" -ForegroundColor White
Write-Host "`n   Port-forward frontend:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward -n $Namespace svc/frontend-service 3000:3000" -ForegroundColor White
Write-Host "`n   Port-forward user-service:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward -n $Namespace svc/user-service 8081:8081" -ForegroundColor White
Write-Host "`n   Shell dans un pod:" -ForegroundColor Yellow
Write-Host "   kubectl exec -n $Namespace -it POD-NAME -- /bin/sh" -ForegroundColor White
Write-Host "`n   Redemarrer un deployment:" -ForegroundColor Yellow
Write-Host "   kubectl rollout restart deployment/NAME -n $Namespace" -ForegroundColor White
Write-Host "`n   Voir tous les pods en temps reel:" -ForegroundColor Yellow
Write-Host "   kubectl get pods -n $Namespace -w" -ForegroundColor White
Write-Host "`n   Supprimer tout le namespace:" -ForegroundColor Yellow
Write-Host "   kubectl delete namespace $Namespace" -ForegroundColor White

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "       DEPLOIEMENT TERMINE!                         " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

# Diagnostics si des pods ont des problemes
if ($failedPods -gt 0) {
    Write-Host "`n[DIAGNOSTIC] Pods en erreur detectes" -ForegroundColor Red
    Write-Host "   Pods problematiques:" -ForegroundColor Yellow
    kubectl get pods -n $Namespace | Select-String "Error|CrashLoop|ImagePull|Pending"
    Write-Host "`n   Commandes de diagnostic:" -ForegroundColor Yellow
    Write-Host "   kubectl describe pod POD-NAME -n $Namespace" -ForegroundColor White
    Write-Host "   kubectl logs POD-NAME -n $Namespace --previous" -ForegroundColor White
}

Write-Host "`n[INFO] Re-executer ce script:" -ForegroundColor Cyan
Write-Host "   .\deploy-complete.ps1                 # Deploiement complet" -ForegroundColor White
Write-Host "   .\deploy-complete.ps1 -SkipBuild      # Sans rebuild images" -ForegroundColor White
Write-Host "   .\deploy-complete.ps1 -SkipDeploy     # Juste monitoring" -ForegroundColor White
