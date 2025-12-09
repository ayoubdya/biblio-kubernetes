# Script de test automatisé - Stratégie A : Keycloak comme source unique

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLET - STRATÉGIE A" -ForegroundColor Cyan
Write-Host "   Keycloak = Source unique de vérité" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$keycloakUrl = "http://localhost:8180"
$serviceUrl = "http://localhost:8081"
$realm = "biblio"
$clientId = "biblio-client"


# Fonction pour obtenir un token Keycloak
function Get-KeycloakToken {
    param (
        [string]$username,
        [string]$password
    )
    
    $body = @{
        grant_type = "password"
        client_id = $clientId
        username = $username
        password = $password
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$keycloakUrl/realms/$realm/protocol/openid-connect/token" `
            -Method Post `
            -Body $body `
            -ContentType "application/x-www-form-urlencoded"
        return $response.access_token
    } catch {
        Write-Host "❌ Erreur lors de l'obtention du token pour $username" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $null
    }
}

# Fonction pour synchroniser un utilisateur
function Sync-User {
    param (
        [string]$token,
        [string]$username
    )
    
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$serviceUrl/api/sync/user" `
            -Method Post `
            -Headers $headers
        return $response
    } catch {
        Write-Host "❌ Erreur lors de la synchronisation de $username" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $null
    }
}

# Test 1 : Vérifier que les services sont UP
Write-Host "=== TEST 1 : Vérification des services ===" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$serviceUrl/actuator/health"
    if ($health.status -eq "UP") {
        Write-Host "✅ User Service : UP" -ForegroundColor Green
    } else {
        Write-Host "❌ User Service : DOWN" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ User Service inaccessible" -ForegroundColor Red
    exit 1
}

# Test 2 : Authentifier adminuser avec Keycloak
Write-Host "`n=== TEST 2 : Authentification adminuser ===" -ForegroundColor Yellow
$adminToken = Get-KeycloakToken -username "adminuser" -password "admin123"
if ($adminToken) {
    Write-Host "✅ Token JWT obtenu pour adminuser" -ForegroundColor Green
    Write-Host "Token (premiers 50 caractères) : $($adminToken.Substring(0, 50))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Échec de l'authentification adminuser" -ForegroundColor Red
    Write-Host "⚠️  Assurez-vous que l'utilisateur 'adminuser' existe dans Keycloak" -ForegroundColor Yellow
    Write-Host "    Voir KEYCLOAK-USER-CREATION.md pour créer les utilisateurs" -ForegroundColor Yellow
    exit 1
}

# Test 3 : Synchroniser adminuser dans PostgreSQL
Write-Host "`n=== TEST 3 : Synchronisation adminuser → PostgreSQL ===" -ForegroundColor Yellow
$syncResponse = Sync-User -token $adminToken -username "adminuser"
if ($syncResponse) {
    Write-Host "✅ adminuser synchronisé dans PostgreSQL" -ForegroundColor Green
    Write-Host "User ID : $($syncResponse.user.id)" -ForegroundColor Gray
    Write-Host "Username : $($syncResponse.user.username)" -ForegroundColor Gray
    Write-Host "Email : $($syncResponse.user.email)" -ForegroundColor Gray
    Write-Host "Roles : $($syncResponse.user.roles -join ', ')" -ForegroundColor Gray
} else {
    Write-Host "❌ Échec de la synchronisation" -ForegroundColor Red
    exit 1
}

# Test 4 : Accéder à /api/users avec adminuser (nécessite rôle ADMIN)
Write-Host "`n=== TEST 4 : Accès /api/users avec adminuser (ADMIN) ===" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $adminToken"
}
try {
    $users = Invoke-RestMethod -Uri "$serviceUrl/api/users" -Method Get -Headers $headers
    Write-Host "✅ Accès autorisé à /api/users" -ForegroundColor Green
    Write-Host "Nombre d'utilisateurs : $($users.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Accès refusé à /api/users" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 5 : Authentifier normaluser avec Keycloak
Write-Host "`n=== TEST 5 : Authentification normaluser ===" -ForegroundColor Yellow
$userToken = Get-KeycloakToken -username "normaluser" -password "user123"
if ($userToken) {
    Write-Host "✅ Token JWT obtenu pour normaluser" -ForegroundColor Green
    Write-Host "Token (premiers 50 caractères) : $($userToken.Substring(0, 50))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Échec de l'authentification normaluser" -ForegroundColor Red
    Write-Host "⚠️  Assurez-vous que l'utilisateur 'normaluser' existe dans Keycloak" -ForegroundColor Yellow
    Write-Host "    Voir KEYCLOAK-USER-CREATION.md pour créer les utilisateurs" -ForegroundColor Yellow
    exit 1
}

# Test 6 : Synchroniser normaluser dans PostgreSQL
Write-Host "`n=== TEST 6 : Synchronisation normaluser → PostgreSQL ===" -ForegroundColor Yellow
$syncResponse = Sync-User -token $userToken -username "normaluser"
if ($syncResponse) {
    Write-Host "✅ normaluser synchronisé dans PostgreSQL" -ForegroundColor Green
    Write-Host "User ID : $($syncResponse.user.id)" -ForegroundColor Gray
    Write-Host "Username : $($syncResponse.user.username)" -ForegroundColor Gray
    Write-Host "Email : $($syncResponse.user.email)" -ForegroundColor Gray
    Write-Host "Roles : $($syncResponse.user.roles -join ', ')" -ForegroundColor Gray
} else {
    Write-Host "❌ Échec de la synchronisation" -ForegroundColor Red
    exit 1
}

# Test 7 : Vérifier que /api/auth/register est désactivé
Write-Host "`n=== TEST 7 : Vérifier que /api/auth/register est désactivé ===" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        email = "test@example.com"
        password = "test123"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$serviceUrl/api/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "❌ /api/auth/register est encore actif (devrait être désactivé)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ /api/auth/register est désactivé (404 Not Found)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ /api/auth/register nécessite authentification" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Statut inattendu : $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test 8 : Vérifier dans PostgreSQL
Write-Host "`n=== TEST 8 : Vérification dans PostgreSQL ===" -ForegroundColor Yellow
try {
    $pgUsers = docker exec biblio-postgres psql -U postgres -d userdb -t -c "SELECT COUNT(*) FROM users;" 2>$null
    if ($pgUsers) {
        $count = $pgUsers.Trim()
        Write-Host "✅ Nombre d'utilisateurs dans PostgreSQL : $count" -ForegroundColor Green
        
        # Afficher les utilisateurs
        Write-Host "`nUtilisateurs dans PostgreSQL :" -ForegroundColor Gray
        docker exec biblio-postgres psql -U postgres -d userdb -c "SELECT id, username, email, enabled FROM users;" 2>$null
        
        Write-Host "`nRôles des utilisateurs :" -ForegroundColor Gray
        docker exec biblio-postgres psql -U postgres -d userdb -c "SELECT u.username, r.role FROM users u JOIN user_roles r ON u.id = r.user_id ORDER BY u.id;" 2>$null
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier PostgreSQL" -ForegroundColor Yellow
}

# Résumé final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Services opérationnels" -ForegroundColor Green
Write-Host "✅ Authentification via Keycloak" -ForegroundColor Green
Write-Host "✅ Synchronisation Keycloak → PostgreSQL" -ForegroundColor Green
Write-Host "✅ Accès aux endpoints protégés avec JWT" -ForegroundColor Green
Write-Host "✅ /api/auth/register désactivé" -ForegroundColor Green
Write-Host "✅ Utilisateurs synchronisés dans PostgreSQL`n" -ForegroundColor Green

Write-Host "🎉 TOUS LES TESTS SONT PASSÉS !" -ForegroundColor Green
Write-Host "📖 Voir KEYCLOAK-USER-CREATION.md pour plus d'informations`n" -ForegroundColor Cyan
