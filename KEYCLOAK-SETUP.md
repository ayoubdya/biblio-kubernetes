# Configuration Keycloak pour Biblio Kubernetes

## 🚀 Démarrage de Keycloak

### 1. Démarrer tous les services incluant Keycloak

```bash
docker-compose up -d
```

Keycloak sera disponible sur **http://localhost:8080**

### 2. Accès à la console d'administration

- **URL**: http://localhost:8080
- **Username**: `admin`
- **Password**: `admin`

### 3. Configuration automatique

Le realm `biblio` est importé automatiquement depuis `/user-service/keycloak/realm-export.json`

## 📋 Configuration du Realm Biblio

### Roles disponibles
- **USER** - Utilisateur standard
- **ADMIN** - Administrateur

### Clients
- **biblio-app** - Application frontend

## 🔐 Création d'utilisateurs via Keycloak Admin

### Via l'interface Admin

1. Connectez-vous à http://localhost:8080
2. Sélectionnez le realm **biblio**
3. Allez dans **Users** → **Add user**
4. Remplissez:
   - Username
   - Email
   - First Name / Last Name (optionnel)
   - Email Verified: ON
   - Enabled: ON
5. Cliquez sur **Create**
6. Allez dans l'onglet **Credentials**
7. Définissez un mot de passe et désactivez **Temporary**
8. Allez dans l'onglet **Role mapping**
9. Assignez **USER** ou **ADMIN**

### Via l'API Register

L'endpoint `/api/auth/register` créera automatiquement l'utilisateur dans:
- Keycloak (si `KEYCLOAK_ENABLED=true`)
- PostgreSQL (synchronisation automatique)

## 🔄 Flux d'authentification

### 1. Inscription (`/api/auth/register`)
```json
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Connexion avec Keycloak

Pour obtenir un token JWT:

```bash
curl -X POST http://localhost:8080/realms/biblio/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=biblio-app" \
  -d "username=john_doe" \
  -d "password=password123"
```

Réponse:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

### 3. Utiliser le token dans les requêtes

```bash
curl http://localhost:8081/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🛠️ Configuration Frontend

### Intégration avec Next.js

Installer le package OAuth2:
```bash
npm install next-auth @auth/core
```

### Configuration OAuth2 dans le frontend

Créer `/frontend-service/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
```

### Variables d'environnement Frontend

Ajouter dans `.env.local`:
```env
KEYCLOAK_CLIENT_ID=biblio-app
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ISSUER=http://localhost:8080/realms/biblio
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## 📝 Endpoints API

### Publics (sans auth)
- `POST /api/auth/register` - Inscription
- `GET /api/books/**` - Recherche de livres (OpenLibrary)
- `GET /api/comments/public` - Liste des commentaires
- `POST /api/comments/public` - Ajouter un commentaire (sans auth)

### Protégés (avec JWT)
- `GET /api/users/me` - Profil utilisateur
- `GET /api/users` - Liste des utilisateurs (ADMIN)
- `PUT /api/users/{id}` - Modifier un utilisateur
- `DELETE /api/users/{id}` - Supprimer un utilisateur (ADMIN)
- `POST /api/comments` - Ajouter un commentaire (authentifié)
- `DELETE /api/comments/{id}` - Supprimer son commentaire

## 🔧 Variables d'environnement User Service

Le service détecte automatiquement Keycloak avec:

```yaml
KEYCLOAK_ENABLED: true
KEYCLOAK_REALM: biblio
KEYCLOAK_AUTH_SERVER_URL: http://keycloak:8080
KEYCLOAK_RESOURCE: biblio-app
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: http://localhost:8080/realms/biblio
```

## 🐛 Troubleshooting

### Keycloak ne démarre pas
```bash
docker-compose logs keycloak
```

Vérifier que user-db est healthy:
```bash
docker-compose ps
```

### User-service ne se connecte pas à Keycloak
```bash
docker-compose logs user-service
```

Vérifier la configuration dans `application-docker.yml`

### Tester la connexion Keycloak
```bash
curl http://localhost:8080/health/ready
```

## 📊 Architecture

```
┌─────────────┐
│   Browser   │
│ (Next.js)   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Keycloak   │   │User Service │
│  (OAuth2)   │◄──│  (Spring)   │
└─────────────┘   └──────┬──────┘
       │                 │
       │                 ▼
       │          ┌─────────────┐
       └─────────►│ PostgreSQL  │
                  │  (user_db)  │
                  └─────────────┘
```

## 🎯 Prochaines étapes

1. ✅ Keycloak démarré et configuré
2. ✅ Realm biblio importé
3. ✅ User-service connecté à Keycloak
4. 🔄 Implémenter OAuth2 dans le frontend
5. 🔄 Remplacer l'auth localStorage par NextAuth
6. 🔄 Utiliser les tokens JWT pour les API calls

## 📚 Documentation

- [Keycloak Documentation](https://www.keycloak.org/docs/latest/)
- [Spring Security OAuth2](https://spring.io/projects/spring-security-oauth)
- [NextAuth.js](https://next-auth.js.org/)
