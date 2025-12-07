# Tests User Service

## 1. Test Register (Inscription)

### Créer un utilisateur USER
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"john","email":"john@example.com","password":"password123"}'
```

### Créer un deuxième utilisateur
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"alice","email":"alice@example.com","password":"password123"}'
```

## 2. Test Login

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"john","password":"password123"}'
```

## 3. Vérifier la base de données

### Voir les utilisateurs créés
```powershell
docker exec -it biblio-postgres psql -U postgres -d userdb -c "SELECT * FROM users;"
```

### Voir les rôles
```powershell
docker exec -it biblio-postgres psql -U postgres -d userdb -c "SELECT * FROM user_roles;"
```

## 4. Tests ADMIN (nécessite un JWT Keycloak)

**Note**: Ces endpoints nécessitent un token JWT avec le rôle ADMIN. 
Pour les tester maintenant sans Keycloak :

### Option A: Désactiver temporairement la sécurité pour tester

Ou

### Option B: Ajouter manuellement le rôle ADMIN à un utilisateur

```powershell
docker exec -it biblio-postgres psql -U postgres -d userdb -c "INSERT INTO user_roles (user_id, role) VALUES (1, 'ADMIN');"
```

### Puis tester les endpoints ADMIN:

#### Liste tous les utilisateurs
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users" -Method GET
```

#### Récupérer un utilisateur par ID
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/1" -Method GET
```

#### Modifier un utilisateur
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" `
  -Method PUT `
  -ContentType "application/json" `
  -Body '{"username":"alice_updated","email":"alice_new@example.com","password":"newpass123"}'
```

#### Ajouter un rôle ADMIN à un utilisateur
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/ADMIN" -Method POST
```

#### Retirer un rôle
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2/roles/USER" -Method DELETE
```

#### Supprimer un utilisateur
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/2" -Method DELETE
```

## 5. Test Actuator

```powershell
Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method GET
```

## 6. Vérifier les logs du service

```powershell
docker logs user-service -f
```

## 7. Arrêter et supprimer le container

```powershell
docker stop user-service
docker rm user-service
```

## Résumé des fonctionnalités testées

✅ Register (public)
✅ Login (public)  
✅ CRUD Users (ADMIN uniquement - avec JWT)
✅ Gestion des rôles USER/ADMIN
✅ Connexion PostgreSQL
✅ Validation des données
✅ Passwords hashés avec BCrypt
