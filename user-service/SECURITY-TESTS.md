# Tests de Sécurité - Contrôle d'Accès basé sur les Rôles

## 🎯 Objectif
Vérifier que les endpoints CRUD de `/api/users` sont correctement protégés :
- ✅ **ADMIN** : Accès complet à tous les endpoints CRUD
- ✅ **USER** : Aucun accès aux endpoints CRUD (403 Forbidden)

---

## 👤 Utilisateurs de Test

### 1. ADMIN User
- **Username**: adminuser
- **Password**: admin123
- **Roles**: USER, ADMIN
- **Accès**: Complet sur tous les endpoints `/api/users`

### 2. Normal User
- **Username**: normaluser
- **Password**: normal123
- **Roles**: USER uniquement
- **Accès**: Aucun accès aux endpoints `/api/users` (retourne 403 Forbidden)

---

## ✅ Tests avec USER Normal (normaluser)

### Obtention du Token
```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:8180/realms/biblio/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "username=normaluser&password=normal123&grant_type=password&client_id=biblio-client"

$token = $response.access_token
$headers = @{"Authorization" = "Bearer $token"}
```

**Résultat**: ✅ Token obtenu avec succès

---

### Test 1: GET /api/users
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users" -Method GET -Headers $headers
```

**Résultat**: ✅ **403 Forbidden** - USER n'a pas accès à la liste des utilisateurs

---

### Test 2: GET /api/users/{id}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method GET -Headers $headers
```

**Résultat**: ✅ **403 Forbidden** - USER ne peut pas consulter un utilisateur spécifique

---

### Test 3: PUT /api/users/{id}
```powershell
$body = '{"enabled":false}'
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

**Résultat**: ✅ **403 Forbidden** - USER ne peut pas modifier un utilisateur

---

### Test 4: DELETE /api/users/{id}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method DELETE -Headers $headers
```

**Résultat**: ✅ **403 Forbidden** - USER ne peut pas supprimer un utilisateur

---

### Test 5: POST /api/users/{id}/roles/{role}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method POST -Headers $headers
```

**Résultat**: ✅ **403 Forbidden** - USER ne peut pas ajouter des rôles

---

### Test 6: DELETE /api/users/{id}/roles/{role}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method DELETE -Headers $headers
```

**Résultat**: ✅ **403 Forbidden** - USER ne peut pas retirer des rôles

---

## ✅ Tests avec ADMIN (adminuser)

### Obtention du Token
```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:8180/realms/biblio/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body "username=adminuser&password=admin123&grant_type=password&client_id=biblio-client"

$token = $response.access_token
$headers = @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"}
```

**Résultat**: ✅ Token obtenu avec succès

---

### Test 1: GET /api/users
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users" -Method GET -Headers $headers
```

**Résultat**: ✅ **200 OK** - Liste de 2 utilisateurs retournée

---

### Test 2: GET /api/users/{id}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method GET -Headers $headers
```

**Résultat**: ✅ **200 OK** - Utilisateur "alice-updated" retourné

---

### Test 3: PUT /api/users/{id}
```powershell
$body = @{email="alice-new@example.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method PUT -Headers $headers -Body $body
```

**Résultat**: ✅ **200 OK** - Email modifié avec succès

---

### Test 4: POST /api/users/{id}/roles/{role}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method POST -Headers $headers
```

**Résultat**: ✅ **200 OK** - Role ADMIN ajouté (roles: ADMIN, USER)

---

### Test 5: DELETE /api/users/{id}/roles/{role}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method DELETE -Headers $headers
```

**Résultat**: ✅ **200 OK** - Role ADMIN retiré (roles: USER)

---

### Test 6: DELETE /api/users/{id}
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/1" -Method DELETE -Headers $headers
```

**Résultat**: ✅ **200 OK** - Utilisateur supprimé avec succès

---

## 📊 Résumé des Tests

| Endpoint | USER (normaluser) | ADMIN (adminuser) |
|----------|-------------------|-------------------|
| GET /api/users | ✅ 403 Forbidden | ✅ 200 OK |
| GET /api/users/{id} | ✅ 403 Forbidden | ✅ 200 OK |
| PUT /api/users/{id} | ✅ 403 Forbidden | ✅ 200 OK |
| DELETE /api/users/{id} | ✅ 403 Forbidden | ✅ 200 OK |
| POST /api/users/{id}/roles/{role} | ✅ 403 Forbidden | ✅ 200 OK |
| DELETE /api/users/{id}/roles/{role} | ✅ 403 Forbidden | ✅ 200 OK |

---

## 🔒 Configuration de Sécurité

### SecurityConfig.java
```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()  // Endpoints publics
            .requestMatchers("/actuator/**").permitAll()   // Actuator public
            .anyRequest().authenticated()                  // Tout le reste authentifié
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
        );
    return http.build();
}
```

### UserController.java
Tous les endpoints CRUD sont protégés par `@PreAuthorize("hasRole('ADMIN')`)`:
```java
@GetMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<UserResponse>> getAllUsers() { ... }

@GetMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getUserById(@PathVariable Long id) { ... }

@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> updateUser(...) { ... }

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> deleteUser(@PathVariable Long id) { ... }

@PostMapping("/{id}/roles/{role}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> addRole(...) { ... }

@DeleteMapping("/{id}/roles/{role}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> removeRole(...) { ... }
```

---

## 🎉 Conclusion

✅ **Tous les tests de sécurité passent avec succès !**

- Les utilisateurs avec le rôle **USER** uniquement n'ont **aucun accès** aux endpoints CRUD (403 Forbidden)
- Les utilisateurs avec le rôle **ADMIN** ont **accès complet** à tous les endpoints CRUD (200 OK)
- La configuration de sécurité Spring Security avec Keycloak fonctionne correctement
- L'extraction des rôles depuis `realm_access.roles` du JWT Keycloak est opérationnelle
- Les annotations `@PreAuthorize("hasRole('ADMIN')")` sont correctement appliquées

**Le contrôle d'accès basé sur les rôles (RBAC) est pleinement fonctionnel ! 🔒**
