# User Service

Microservice de gestion des utilisateurs avec Spring Boot et Keycloak.

## 🔐 Stratégie d'Authentification : Keycloak comme Source Unique

Ce projet utilise **la Stratégie A** : Keycloak est la **source unique de vérité** pour l'authentification.

### Architecture
- ✅ **Keycloak** : Gestion des utilisateurs, passwords, rôles, JWT
- ✅ **PostgreSQL** : Copie synchronisée des utilisateurs (métadonnées uniquement)
- ❌ **Endpoints /register et /login** : Désactivés (authentification via Keycloak)

**📖 Voir [STRATEGY-A.md](STRATEGY-A.md) pour la documentation complète**

---

## 🚀 Démarrage Rapide

### 1. Démarrer tous les services
```bash
docker-compose up -d
```

Cela démarre :
- **PostgreSQL** (port 5433)
- **Keycloak** (port 8180)
- **User Service** (port 8081)

### 2. Créer des utilisateurs dans Keycloak
Voir [KEYCLOAK-USER-CREATION.md](KEYCLOAK-USER-CREATION.md) pour le guide complet.

**Accès Keycloak Admin** : http://localhost:8180
- Username : `admin`
- Password : `admin`

### 3. Tester l'authentification
```powershell
# Exécuter le script de test automatisé
.\test-strategy-a.ps1
```

---

## 📋 Endpoints

### Authentication (via Keycloak)
- ❌ ~~`POST /api/auth/register`~~ - **DÉSACTIVÉ** (créer users dans Keycloak)
- ❌ ~~`POST /api/auth/login`~~ - **DÉSACTIVÉ** (utiliser Keycloak OAuth2)
- ✅ `POST /api/sync/user` - Synchroniser l'user Keycloak → PostgreSQL (nécessite JWT)

### Keycloak Token Endpoint
```
POST http://localhost:8180/realms/biblio/protocol/openid-connect/token

Body (x-www-form-urlencoded):
- grant_type: password
- client_id: biblio-client
- username: adminuser
- password: admin123
```

### Users Management (requiert JWT + rôle ADMIN)
- `GET /api/users` - Liste tous les utilisateurs
- `GET /api/users/{id}` - Récupérer un utilisateur
- `PUT /api/users/{id}` - Modifier un utilisateur
- `DELETE /api/users/{id}` - Supprimer un utilisateur
- `POST /api/users/{id}/roles/{role}` - Ajouter un rôle
- `DELETE /api/users/{id}/roles/{role}` - Retirer un rôle

## Build et Run

### Avec Docker Compose (Recommandé)
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Avec Maven local (Dev)
```bash
mvn clean package
java -jar target/user-service-0.0.1-SNAPSHOT.jar
```

### Rebuild Docker image
```bash
docker build -t user-service:latest .
docker-compose up -d --force-recreate user-service
```

---

## 🧪 Tests

### Test automatisé complet
```powershell
.\test-strategy-a.ps1
```

### Test manuel
Voir [KEYCLOAK-USER-CREATION.md](KEYCLOAK-USER-CREATION.md)

---

## 📚 Documentation

- **[STRATEGY-A.md](STRATEGY-A.md)** - Architecture et stratégie d'authentification
- **[KEYCLOAK-USER-CREATION.md](KEYCLOAK-USER-CREATION.md)** - Guide de création d'utilisateurs
- **[DOCKER-COMPOSE-GUIDE.md](DOCKER-COMPOSE-GUIDE.md)** - Guide Docker Compose
- **[test-strategy-a.ps1](test-strategy-a.ps1)** - Script de test automatisé

---

## Configuration

### Variables d'environnement
- `DB_HOST` : Hôte PostgreSQL (défaut: localhost)
- `DB_PORT` : Port PostgreSQL (défaut: 5432)
- `DB_NAME` : Nom de la base (défaut: userdb)
- `DB_USER` : Utilisateur PostgreSQL (défaut: postgres)
- `DB_PASSWORD` : Mot de passe PostgreSQL (défaut: postgres)
- `KEYCLOAK_ISSUER_URI` : URI Keycloak (défaut: http://localhost:8080/realms/biblio)
- `SERVER_PORT` : Port du serveur (défaut: 8081)
