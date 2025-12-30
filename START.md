# 🚀 Démarrage Rapide - Biblio Kubernetes

## ✨ Une seule commande pour tout démarrer !

```bash
docker-compose up --build -d
```

⏱️ **Attendez 2-3 minutes** et accédez à : **http://localhost:3000**

## 🛑 Arrêt des services

```bash
docker-compose down
```

## 🧹 Nettoyage complet (avec volumes/bases de données)

```bash
docker-compose down -v
```

## 📡 Services disponibles

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Frontend** | http://localhost:3000 | Interface utilisateur Next.js |
| 📚 **Catalog** | http://localhost:8090 | Service de catalogage (OpenLibrary API) |
| 👤 **User** | http://localhost:8081 | Gestion des utilisateurs |
| 💬 **Comment** | http://localhost:8082 | Système de commentaires et notes |
| 🐘 **PostgreSQL Comment** | localhost:5432 | Base de données des commentaires |
| 🐘 **PostgreSQL User** | localhost:5433 | Base de données des utilisateurs |

## 📊 Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique  
docker-compose logs -f frontend-service
docker-compose logs -f catalog-service
docker-compose logs -f user-service
docker-compose logs -f comment-service
```

## 🔧 Rebuild un service spécifique

```bash
docker-compose up --build frontend-service -d
docker-compose up --build catalog-service -d
```

## ❤️ Health Checks

- Frontend: http://localhost:3000/api/health
- Catalog: http://localhost:8090/actuator/health
- User: http://localhost:8081/actuator/health
- Comment: http://localhost:8082/actuator/health

## 🐛 Dépannage

### Les services ne démarrent pas ?
```bash
docker-compose down
docker-compose up --build -d
docker-compose logs
```

### Port déjà utilisé ?
Modifiez les ports dans `docker-compose.yml` :
```yaml
ports:
  - "3001:3000"  # Frontend sur port 3001 au lieu de 3000
```

### Problème de connexion frontend → backend ?
Les services communiquent via le réseau Docker `biblio-network`. Pas besoin de configuration supplémentaire.

## 🎯 Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js 16 (Port 3000)
│   (React 19)    │
└────────┬────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
┌───▼────────┐  ┌──────────┐  ┌──▼───────────┐
│  Catalog   │  │   User   │  │   Comment    │
│  Service   │  │  Service │  │   Service    │
│ (Port 8090)│  │(Port 8081)│  │ (Port 8082) │
└────────────┘  └─────┬────┘  └──────┬───────┘
                      │               │
                 ┌────▼────┐    ┌────▼────┐
                 │User DB  │    │Comment  │
                 │(5433)   │    │DB (5432)│
                 └─────────┘    └─────────┘
```

## 🔑 Credentials par défaut

- **PostgreSQL User**: admin / admin123
- **PostgreSQL Comment**: admin / admin123

