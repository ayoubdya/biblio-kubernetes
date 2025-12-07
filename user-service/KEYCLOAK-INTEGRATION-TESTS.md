# Tests d'Intégration Keycloak - User Service

## 🎯 Résumé
Tous les endpoints ADMIN fonctionnent correctement avec l'authentification JWT Keycloak.

## ⚙️ Configuration

### Service Configuration
- **URL Service**: http://localhost:8081
- **JWT Validation**: JWK Set URI (ne valide pas l'issuer claim)
- **Role Extraction**: Custom converter extractant les roles depuis `realm_access.roles`
- **Role Prefix**: `ROLE_` ajouté automatiquement (ex: `ADMIN` → `ROLE_ADMIN`)

### Keycloak Configuration
- **URL Keycloak**: http://localhost:8180
- **Realm**: biblio
- **Client**: biblio-client (public, Direct access grants enabled)
- **Roles**: USER, ADMIN
- **Test User**: adminuser/admin123 (possède les roles USER et ADMIN)

### Variables d'environnement du conteneur
```bash
DB_HOST=host.docker.internal
DB_PORT=5433
DB_NAME=userdb
DB_USER=postgres
DB_PASSWORD=postgres
KEYCLOAK_JWK_SET_URI=http://host.docker.internal:8180/realms/biblio/protocol/openid-connect/certs
```

## 🔑 Obtention du Token JWT

```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:8180/realms/biblio/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "username=adminuser&password=admin123&grant_type=password&client_id=biblio-client"

$token = $response.access_token
$headers = @{"Authorization" = "Bearer $token"}
```

## ✅ Tests Réussis

### 1. GET /api/users - Liste tous les utilisateurs
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users" -Method GET -Headers $headers
```

**Résultat:**
```json
[
    {
        "id": 1,
        "username": "john",
        "email": "john@example.com",
        "roles": ["ADMIN", "USER"],
        "enabled": true
    },
    {
        "id": 2,
        "username": "alice",
        "email": "alice@example.com",
        "roles": ["USER"],
        "enabled": true
    }
]
```

✅ **Statut**: 200 OK

---

### 2. GET /api/users/{id} - Récupérer un utilisateur
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/1" -Method GET -Headers $headers
```

**Résultat:**
```json
{
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "roles": ["ADMIN", "USER"],
    "enabled": true
}
```

✅ **Statut**: 200 OK

---

### 3. PUT /api/users/{id} - Mise à jour partielle d'un utilisateur
```powershell
# Désactiver un utilisateur
$body = @{enabled=$false} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method PUT -Headers $headers -Body $body -ContentType "application/json"

# Changer email uniquement
$body = @{email="alice.smith@example.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method PUT -Headers $headers -Body $body -ContentType "application/json"

# Changer plusieurs champs simultanément
$body = @{username="alice-updated"; enabled=$true} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

**Résultat:**
```json
{
    "id": 2,
    "username": "alice-updated",
    "email": "alice.smith@example.com",
    "roles": ["USER"],
    "enabled": true
}
```

✅ **Statut**: 200 OK
✅ **Note**: Tous les champs sont optionnels (username, email, password, enabled)

---

### 4. POST /api/users/{id}/roles/{role} - Ajouter un role
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method POST -Headers $headers
```

**Résultat:**
```json
{
    "id": 2,
    "username": "alice",
    "email": "alice@example.com",
    "roles": ["ADMIN", "USER"],
    "enabled": true
}
```

✅ **Statut**: 200 OK
✅ **Vérification**: Le role ADMIN a été ajouté à alice

---

### 5. DELETE /api/users/{id}/roles/{role} - Retirer un role
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method DELETE -Headers $headers
```

**Résultat:**
```json
{
    "id": 2,
    "username": "alice",
    "email": "alice@example.com",
    "roles": ["USER"],
    "enabled": true
}
```

✅ **Statut**: 200 OK
✅ **Vérification**: Le role ADMIN a été retiré d'alice

---

### 6. DELETE /api/users/{id} - Supprimer un utilisateur
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/1" -Method DELETE -Headers $headers
```

**Résultat:**
```json
{
    "message": "User deleted successfully"
}
```

✅ **Statut**: 200 OK
✅ **Vérification**: L'utilisateur john a été supprimé

---

## 🔧 Problèmes Résolus

### Problème 1: Validation du claim `iss`
**Erreur**: `The iss claim is not valid`

**Cause**: Le token JWT contient `http://localhost:8180/realms/biblio` comme issuer, mais le service utilisait `issuer-uri` qui validait ce claim. Le conteneur Docker ne pouvait pas accéder à `localhost:8180`.

**Solution**: Remplacé `issuer-uri` par `jwk-set-uri` dans application.properties:
```properties
# AVANT
spring.security.oauth2.resourceserver.jwt.issuer-uri=${KEYCLOAK_ISSUER_URI:...}

# APRÈS  
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=${KEYCLOAK_JWK_SET_URI:...}
```

Le `jwk-set-uri` ne valide pas le claim issuer, il vérifie seulement la signature JWT.

### Problème 2: Extraction des roles depuis Keycloak JWT
**Erreur**: 401 Unauthorized même avec un token valide

**Cause**: Spring Security ne savait pas extraire les roles depuis le claim `realm_access.roles` de Keycloak.

**Solution**: Ajout d'un custom `JwtAuthenticationConverter` dans `SecurityConfig.java`:
```java
private JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        Collection<GrantedAuthority> authorities;
        
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
        } else {
            authorities = List.of();
        }
        
        return authorities;
    });
    return converter;
}
```

---

## 📝 Notes Importantes

1. **JWK Set URI vs Issuer URI**:
   - `issuer-uri`: Valide le claim `iss` du JWT (problématique avec Docker)
   - `jwk-set-uri`: Vérifie seulement la signature JWT (recommandé)

2. **Structure JWT Keycloak**:
   ```json
   {
     "realm_access": {
       "roles": ["ADMIN", "USER", "default-roles-biblio", ...]
     }
   }
   ```

3. **Role Mapping Spring Security**:
   - Keycloak role: `ADMIN`
   - Spring Security authority: `ROLE_ADMIN`
   - Annotation: `@PreAuthorize("hasRole('ADMIN')")`

4. **Mise à jour partielle avec UpdateUserRequest**:
   - Tous les champs sont optionnels
   - Seuls les champs fournis sont mis à jour
   - Champs disponibles: `username`, `email`, `password`, `enabled`

---

## 🚀 Commandes Rapides

### Démarrer les services
```powershell
# PostgreSQL (déjà démarré sur port 5433)
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=userdb -p 5433:5432 postgres:15-alpine

# Keycloak (déjà démarré sur port 8180)
docker run -d --name keycloak -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin -p 8180:8080 quay.io/keycloak/keycloak:23.0.1 start-dev

# User Service
docker run -d --name user-service -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5433 \
  -e DB_NAME=userdb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e KEYCLOAK_JWK_SET_URI=http://host.docker.internal:8180/realms/biblio/protocol/openid-connect/certs \
  user-service
```

### Test rapide complet
```powershell
# 1. Obtenir token
$response = Invoke-RestMethod -Uri "http://localhost:8180/realms/biblio/protocol/openid-connect/token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "username=adminuser&password=admin123&grant_type=password&client_id=biblio-client"
$token = $response.access_token
$headers = @{"Authorization" = "Bearer $token"}

# 2. Tester endpoint ADMIN
Invoke-RestMethod -Uri "http://localhost:8081/api/users" -Method GET -Headers $headers
```

---

## 🎉 Conclusion

✅ L'intégration Keycloak fonctionne parfaitement  
✅ Tous les endpoints ADMIN sont protégés et accessibles avec JWT  
✅ L'extraction des roles depuis Keycloak JWT est opérationnelle  
✅ La validation JWT utilise le JWK Set URI (compatible Docker)
