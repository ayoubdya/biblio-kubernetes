# User Service

Microservice de gestion des utilisateurs avec Spring Boot et Keycloak.

## Fonctionnalités

- **Register** : Inscription d'un nouvel utilisateur (rôle USER par défaut)
- **Login** : Connexion (à intégrer avec Keycloak pour JWT)
- **CRUD Utilisateurs** : Gestion complète des utilisateurs (ADMIN uniquement)
- **Gestion des rôles** : USER et ADMIN

## Endpoints

### Auth (Public)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Users (ADMIN uniquement)
- `GET /api/users` - Liste tous les utilisateurs
- `GET /api/users/{id}` - Récupérer un utilisateur
- `PUT /api/users/{id}` - Modifier un utilisateur
- `DELETE /api/users/{id}` - Supprimer un utilisateur
- `POST /api/users/{id}/roles/{role}` - Ajouter un rôle
- `DELETE /api/users/{id}/roles/{role}` - Retirer un rôle

## Build et Run

### Avec Maven local
```bash
mvn clean package
java -jar target/user-service-0.0.1-SNAPSHOT.jar
```

### Avec Docker
```bash
docker build -t user-service .
docker run -p 8081:8081 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=userdb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e KEYCLOAK_ISSUER_URI=http://keycloak:8080/realms/biblio \
  user-service
```

## Configuration

Variables d'environnement :
- `DB_HOST` : Hôte PostgreSQL (défaut: localhost)
- `DB_PORT` : Port PostgreSQL (défaut: 5432)
- `DB_NAME` : Nom de la base (défaut: userdb)
- `DB_USER` : Utilisateur PostgreSQL (défaut: postgres)
- `DB_PASSWORD` : Mot de passe PostgreSQL (défaut: postgres)
- `KEYCLOAK_ISSUER_URI` : URI Keycloak (défaut: http://localhost:8080/realms/biblio)
- `SERVER_PORT` : Port du serveur (défaut: 8081)
