param(
    [string]$Namespace = "biblio"
)

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "       Kubernetes Deployment Status Monitor        " -ForegroundColor Cyan
Write-Host "       Namespace: $Namespace                        " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. PODS
Write-Host "`n[PODS] Status des Pods" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get pods -n $Namespace -o wide

# 2. SERVICES
Write-Host "`n[SERVICES] Points d'acces reseau" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get svc -n $Namespace

# 3. DEPLOYMENTS
Write-Host "`n[DEPLOYMENTS] Gestion des pods" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get deployments -n $Namespace

# 4. PERSISTENT VOLUME CLAIMS
Write-Host "`n[PVC] Stockage persistant" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get pvc -n $Namespace

# 5. CONFIGMAPS
Write-Host "`n[CONFIGMAPS] Configuration" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get configmaps -n $Namespace

# 6. SECRETS
Write-Host "`n[SECRETS] Donnees sensibles" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get secrets -n $Namespace

# 7. INGRESS
Write-Host "`n[INGRESS] Regles d'entree" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get ingress -n $Namespace

# 8. EVENTS RECENTS
Write-Host "`n[EVENTS] Evenements recents" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray
kubectl get events -n $Namespace --sort-by='.lastTimestamp' | Select-Object -Last 10

# 9. RESUME
Write-Host "`n[SUMMARY] Resume des ressources" -ForegroundColor Green
Write-Host "-"*60 -ForegroundColor Gray

$pods = kubectl get pods -n $Namespace --no-headers 2>$null
$podCount = ($pods | Measure-Object).Count
$runningPods = ($pods | Where-Object { $_ -match "Running" } | Measure-Object).Count
$pendingPods = ($pods | Where-Object { $_ -match "Pending" } | Measure-Object).Count
$failedPods = ($pods | Where-Object { $_ -match "Error|CrashLoop" } | Measure-Object).Count

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

# 10. COMMANDES UTILES
Write-Host "`n[COMMANDS] Commandes utiles" -ForegroundColor Cyan
Write-Host "-"*60 -ForegroundColor Gray
Write-Host "   Logs d'un pod:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n $Namespace POD-NAME --tail=50" -ForegroundColor White
Write-Host "`n   Port-forward frontend:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward -n $Namespace svc/frontend-service 3000:3000" -ForegroundColor White
Write-Host "`n   Shell dans un pod:" -ForegroundColor Yellow
Write-Host "   kubectl exec -n $Namespace -it POD-NAME -- /bin/sh" -ForegroundColor White
Write-Host "`n   Redemarrer un deployment:" -ForegroundColor Yellow
Write-Host "   kubectl rollout restart deployment/NAME -n $Namespace" -ForegroundColor White

Write-Host "`n[SUCCESS] Monitoring termine!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
