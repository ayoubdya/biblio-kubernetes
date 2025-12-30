# ==========================================
# Script de déploiement complet Kubernetes
# Biblio Application
# ==========================================

Write-Host "🚀 Démarrage du déploiement Kubernetes..." -ForegroundColor Cyan

# Vérifier que kubectl est disponible
Write-Host "`n📋 Vérification de kubectl..." -ForegroundColor Yellow
try {
    kubectl version --client | Out-Null
    Write-Host "✅ kubectl est installé" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier la connexion au cluster
Write-Host "`n🔗 Vérification de la connexion au cluster..." -ForegroundColor Yellow
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Connexion au cluster Kubernetes réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Impossible de se connecter au cluster Kubernetes" -ForegroundColor Red
    exit 1
}

# Étape 1: Créer le namespace
Write-Host "`n📦 Étape 1/8: Création du namespace 'biblio'..." -ForegroundColor Yellow
kubectl apply -f namespace.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Namespace créé avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création du namespace" -ForegroundColor Red
    exit 1
}

# Étape 2: Créer les secrets
Write-Host "`n🔐 Étape 2/8: Création des secrets..." -ForegroundColor Yellow
kubectl apply -f secrets.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secrets créés avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création des secrets" -ForegroundColor Red
    exit 1
}

# Étape 3: Créer les ConfigMaps
Write-Host "`n⚙️  Étape 3/8: Création des ConfigMaps..." -ForegroundColor Yellow
kubectl apply -f configmap.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ConfigMaps créés avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création des ConfigMaps" -ForegroundColor Red
    exit 1
}

# Étape 4: Déployer les bases de données
Write-Host "`n🗄️  Étape 4/8: Déploiement des bases de données PostgreSQL..." -ForegroundColor Yellow
kubectl apply -f postgres-user-db.yaml
kubectl apply -f postgres-comment-db.yaml

Write-Host "⏳ Attente que les bases de données soient prêtes (max 2 minutes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$maxAttempts = 12
$attempt = 0
$userDbReady = $false
$commentDbReady = $false

while ($attempt -lt $maxAttempts -and (-not $userDbReady -or -not $commentDbReady)) {
    $attempt++
    Write-Host "   Tentative $attempt/$maxAttempts..." -ForegroundColor Gray
    
    if (-not $userDbReady) {
        $userDbStatus = kubectl get pods -n biblio -l app=user-db -o jsonpath='{.items[0].status.phase}' 2>$null
        if ($userDbStatus -eq "Running") {
            $userDbReady = $true
            Write-Host "   ✅ user-db est prêt" -ForegroundColor Green
        }
    }
    
    if (-not $commentDbReady) {
        $commentDbStatus = kubectl get pods -n biblio -l app=comment-db -o jsonpath='{.items[0].status.phase}' 2>$null
        if ($commentDbStatus -eq "Running") {
            $commentDbReady = $true
            Write-Host "   ✅ comment-db est prêt" -ForegroundColor Green
        }
    }
    
    if (-not $userDbReady -or -not $commentDbReady) {
        Start-Sleep -Seconds 10
    }
}

if ($userDbReady -and $commentDbReady) {
    Write-Host "✅ Bases de données déployées avec succès" -ForegroundColor Green
} else {
    Write-Host "⚠️  Timeout: Les bases de données mettent plus de temps que prévu" -ForegroundColor Yellow
    Write-Host "   Continuons quand même le déploiement..." -ForegroundColor Yellow
}

# Étape 5: Déployer les microservices backend
Write-Host "`n🔧 Étape 5/8: Déploiement des microservices backend..." -ForegroundColor Yellow
kubectl apply -f user-service.yaml
kubectl apply -f catalog-service.yaml
kubectl apply -f comment-service.yaml

Write-Host "⏳ Attente de 15 secondes pour que les services démarrent..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "✅ Microservices backend déployés" -ForegroundColor Green

# Étape 6: Déployer le frontend
Write-Host "`n🌐 Étape 6/8: Déploiement du frontend Next.js..." -ForegroundColor Yellow
kubectl apply -f frontend-service.yaml
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend déployé avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du déploiement du frontend" -ForegroundColor Red
}

# Étape 7: Déployer l'Ingress (optionnel)
Write-Host "`n🌍 Étape 7/8: Déploiement de l'Ingress..." -ForegroundColor Yellow
if (Test-Path "ingress.yaml") {
    kubectl apply -f ingress.yaml
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ingress déployé avec succès" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erreur lors du déploiement de l'Ingress (ignoré)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Fichier ingress.yaml introuvable (ignoré)" -ForegroundColor Yellow
}

# Étape 8: Afficher le statut final
Write-Host "`n📊 Étape 8/8: Vérification du déploiement..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📋 STATUT DES PODS" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
kubectl get pods -n biblio -o wide

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "🌐 STATUT DES SERVICES" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
kubectl get svc -n biblio

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📦 STATUT DES DEPLOYMENTS" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
kubectl get deployments -n biblio

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "💾 STATUT DES VOLUMES" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
kubectl get pvc -n biblio

Write-Host "`n✅ Déploiement terminé!" -ForegroundColor Green
Write-Host "`n📌 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Attendre que tous les pods soient 'Running' (utilisez: kubectl get pods -n biblio -w)" -ForegroundColor White
Write-Host "   2. Exposer les services localement avec port-forward:" -ForegroundColor White
Write-Host "      kubectl port-forward -n biblio svc/frontend-service 3000:3000" -ForegroundColor Cyan
Write-Host "      kubectl port-forward -n biblio svc/user-service 8081:8081" -ForegroundColor Cyan
Write-Host "   3. Accéder à l'application sur http://localhost:3000" -ForegroundColor White
Write-Host "`n📖 Commandes utiles:" -ForegroundColor Yellow
Write-Host "   - Voir les logs: kubectl logs -n biblio -l app=<service-name> --tail=50" -ForegroundColor White
Write-Host "   - Redémarrer un pod: kubectl rollout restart deployment/<name> -n biblio" -ForegroundColor White
Write-Host "   - Supprimer tout: kubectl delete namespace biblio" -ForegroundColor White
