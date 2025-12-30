# ==========================================
# Script de visualisation Kubernetes
# Affiche toutes les valeurs déployées
# ==========================================

param(
    [string]$Namespace = "biblio",
    [switch]$Detailed
)

Write-Host "🔍 Visualisation des ressources Kubernetes" -ForegroundColor Cyan
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Cyan

# 1. PODS
Write-Host "`n📦 PODS (Instances d'application)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get pods -n $Namespace -o wide

if ($Detailed) {
    Write-Host "`n   Détails des pods:" -ForegroundColor Yellow
    $pods = kubectl get pods -n $Namespace -o jsonpath='{.items[*].metadata.name}'
    foreach ($pod in $pods.Split()) {
        Write-Host "`n   📌 Pod: $pod" -ForegroundColor Cyan
        kubectl describe pod $pod -n $Namespace | Select-String "Name:|Status:|IP:|Node:|Image:|Ready:|Restart Count:"
    }
}

# 2. SERVICES
Write-Host "`n🌐 SERVICES (Points d'accès réseau)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get svc -n $Namespace -o wide

if ($Detailed) {
    Write-Host "`n   Endpoints des services:" -ForegroundColor Yellow
    kubectl get endpoints -n $Namespace
}

# 3. DEPLOYMENTS
Write-Host "`n🚀 DEPLOYMENTS (Gestion des pods)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get deployments -n $Namespace -o wide

# 4. REPLICASETS
Write-Host "`n📋 REPLICASETS (Réplicas des pods)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get rs -n $Namespace

# 5. CONFIGMAPS
Write-Host "`n⚙️  CONFIGMAPS (Configuration)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get configmap -n $Namespace

if ($Detailed) {
    Write-Host "`n   Contenu des ConfigMaps:" -ForegroundColor Yellow
    $configmaps = kubectl get configmap -n $Namespace -o jsonpath='{.items[*].metadata.name}'
    foreach ($cm in $configmaps.Split()) {
        if ($cm -ne "kube-root-ca.crt") {
            Write-Host "`n   📌 ConfigMap: $cm" -ForegroundColor Cyan
            kubectl get configmap $cm -n $Namespace -o yaml | Select-String "data:" -Context 0,20
        }
    }
}

# 6. SECRETS
Write-Host "`n🔐 SECRETS (Données sensibles)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get secrets -n $Namespace

if ($Detailed) {
    Write-Host "`n   ⚠️  Les valeurs des secrets sont masquées pour la sécurité" -ForegroundColor Yellow
    $secrets = kubectl get secrets -n $Namespace -o jsonpath='{.items[*].metadata.name}'
    foreach ($secret in $secrets.Split()) {
        if ($secret -notlike "default-token*" -and $secret -notlike "*-token-*") {
            Write-Host "`n   📌 Secret: $secret" -ForegroundColor Cyan
            kubectl get secret $secret -n $Namespace -o jsonpath='{.data}' | ConvertFrom-Json | Get-Member -MemberType NoteProperty | Select-Object Name
        }
    }
}

# 7. PERSISTENT VOLUMES
Write-Host "`n💾 PERSISTENT VOLUME CLAIMS (Stockage)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get pvc -n $Namespace

# 8. INGRESS
Write-Host "`n🌍 INGRESS (Routage externe)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
$ingress = kubectl get ingress -n $Namespace 2>$null
if ($ingress) {
    kubectl get ingress -n $Namespace -o wide
} else {
    Write-Host "   Aucun Ingress trouvé" -ForegroundColor Gray
}

# 9. EVENTS
Write-Host "`n[EVENTS] EVENTS RECENTS (Dernieres 10 minutes)" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get events -n $Namespace --sort-by='.lastTimestamp' | Select-Object -Last 15

# 10. RESUME DES RESSOURCES
Write-Host "`n[SUMMARY] RESUME DES RESSOURCES" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray

$podCount = (kubectl get pods -n $Namespace --no-headers 2>$null | Measure-Object).Count
$svcCount = (kubectl get svc -n $Namespace --no-headers 2>$null | Measure-Object).Count
$deployCount = (kubectl get deployments -n $Namespace --no-headers 2>$null | Measure-Object).Count
$pvcCount = (kubectl get pvc -n $Namespace --no-headers 2>$null | Measure-Object).Count

Write-Host "   Pods:        $podCount" -ForegroundColor White
Write-Host "   Services:    $svcCount" -ForegroundColor White
Write-Host "   Deployments: $deployCount" -ForegroundColor White
Write-Host "   PVCs:        $pvcCount" -ForegroundColor White

# 11. STATUT DE SANTÉ
Write-Host "`n💚 STATUT DE SANTÉ" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray

$runningPods = (kubectl get pods -n $Namespace --field-selector=status.phase=Running --no-headers 2>$null | Measure-Object).Count
$pendingPods = (kubectl get pods -n $Namespace --field-selector=status.phase=Pending --no-headers 2>$null | Measure-Object).Count
$failedPods = (kubectl get pods -n $Namespace --field-selector=status.phase=Failed --no-headers 2>$null | Measure-Object).Count

Write-Host "   ✅ Running: $runningPods pods" -ForegroundColor Green
if ($pendingPods -gt 0) {
    Write-Host "   ⏳ Pending: $pendingPods pods" -ForegroundColor Yellow
}
if ($failedPods -gt 0) {
    Write-Host "   ❌ Failed:  $failedPods pods" -ForegroundColor Red
}

Write-Host "`n[COMMANDS] COMMANDES UTILES" -ForegroundColor Cyan
Write-Host "-"*60 -ForegroundColor Gray
Write-Host "   Logs d'un pod:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n $Namespace POD-NAME --tail=50" -ForegroundColor White
Write-Host "`n   Logs en temps reel:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n $Namespace -f -l app=SERVICE-NAME" -ForegroundColor White
Write-Host "`n   Shell dans un pod:" -ForegroundColor Yellow
Write-Host "   kubectl exec -n $Namespace -it POD-NAME -- /bin/sh" -ForegroundColor White
Write-Host "`n   Port-forward pour acces local:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward -n $Namespace svc/frontend-service 3000:3000" -ForegroundColor White
Write-Host "`n   Redemarrer un deployment:" -ForegroundColor Yellow
Write-Host "   kubectl rollout restart deployment/NAME -n $Namespace" -ForegroundColor White
Write-Host "`n   Voir les valeurs d'un ConfigMap:" -ForegroundColor Yellow
Write-Host "   kubectl get configmap NAME -n $Namespace -o yaml" -ForegroundColor White
Write-Host "`n   Voir les valeurs decodees d'un Secret:" -ForegroundColor Yellow
Write-Host "   kubectl get secret NAME -n $Namespace -o jsonpath='{.data.KEY}' | base64 -d" -ForegroundColor White

Write-Host "`n[SUCCESS] Visualisation terminee!" -ForegroundColor Green
Write-Host "`nUtilisez le flag -Detailed pour plus d'informations:" -ForegroundColor Yellow
Write-Host "   .\view-k8s.ps1 -Detailed" -ForegroundColor Cyan
