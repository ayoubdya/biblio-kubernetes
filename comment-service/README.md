# Comment Service

A microservice for managing book comments and ratings in the Biblio library system.

## Features

- CRUD operations for comments
- Rating system (1-5 stars)
- Get comments by book key or user ID
- Rating statistics for books
- Prometheus metrics endpoints
- Pagination support

## Tech Stack

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL
- Lombok
- Micrometer (Prometheus metrics)

## API Endpoints

### Comments

| Method | Endpoint                                            | Description                             |
| ------ | --------------------------------------------------- | --------------------------------------- |
| POST   | `/api/comments`                                     | Create a new comment                    |
| GET    | `/api/comments/{id}`                                | Get comment by ID                       |
| GET    | `/api/comments/book/{bookKey}`                      | Get all comments for a book (paginated) |
| GET    | `/api/comments/user/{userId}`                       | Get all comments by a user (paginated)  |
| PUT    | `/api/comments/{id}`                                | Update a comment                        |
| DELETE | `/api/comments/{id}`                                | Delete a comment                        |
| GET    | `/api/comments/book/{bookKey}/stats`                | Get rating statistics for a book        |
| GET    | `/api/comments/book/{bookKey}/user/{userId}/exists` | Check if user has commented             |
| GET    | `/api/comments/book/{bookKey}/user/{userId}`        | Get user's comment on a book            |

### Monitoring

| Endpoint               | Description        |
| ---------------------- | ------------------ |
| `/actuator/health`     | Health check       |
| `/actuator/info`       | Application info   |
| `/actuator/prometheus` | Prometheus metrics |
| `/actuator/metrics`    | Micrometer metrics |

## Request/Response Examples

### Create Comment

**Request:**

```json
POST /api/comments
{
  "bookKey": "OL27448W",
  "userId": "user123",
  "username": "johndoe",
  "content": "Great book! Highly recommended.",
  "rating": 5
}
```

**Response:**

```json
{
  "id": 1,
  "bookKey": "OL27448W",
  "userId": "user123",
  "username": "johndoe",
  "content": "Great book! Highly recommended.",
  "rating": 5,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

### Get Rating Stats

**Request:**

```
GET /api/comments/book/OL27448W/stats
```

**Response:**

```json
{
  "bookKey": "OL27448W",
  "averageRating": 4.5,
  "totalComments": 10,
  "rating5Count": 5,
  "rating4Count": 3,
  "rating3Count": 1,
  "rating2Count": 1,
  "rating1Count": 0
}
```

## Running the Service

### Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL (or use H2 for development)

### Run with Maven

```bash
# Run with default settings (uses PostgreSQL)
./mvnw spring-boot:run

# Run with H2 for local development
./mvnw spring-boot:run -Dspring.profiles.active=test
```

### Run Tests

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report
```

### Docker

```bash
# Build the image
docker build -t comment-service .

# Run with docker-compose
docker-compose up -d
```

## Environment Variables

| Variable      | Description       | Default     |
| ------------- | ----------------- | ----------- |
| `SERVER_PORT` | Server port       | `8082`      |
| `DB_HOST`     | Database host     | `localhost` |
| `DB_PORT`     | Database port     | `5432`      |
| `DB_NAME`     | Database name     | `commentdb` |
| `DB_USER`     | Database user     | `postgres`  |
| `DB_PASSWORD` | Database password | `postgres`  |

## Custom Metrics

The service exposes custom Prometheus metrics:

- `comments_created_total` - Total number of comments created
- `comments_deleted_total` - Total number of comments deleted

## Project Structure

```
comment-service/
├── src/
│   ├── main/
│   │   ├── java/com/biblio/commentservice/
│   │   │   ├── CommentServiceApplication.java
│   │   │   ├── config/
│   │   │   │   └── MetricsConfig.java
│   │   │   ├── controller/
│   │   │   │   └── CommentController.java
│   │   │   ├── dto/
│   │   │   │   ├── BookRatingStats.java
│   │   │   │   ├── CommentResponse.java
│   │   │   │   ├── CreateCommentRequest.java
│   │   │   │   └── UpdateCommentRequest.java
│   │   │   ├── entity/
│   │   │   │   └── Comment.java
│   │   │   ├── exception/
│   │   │   │   ├── CommentNotFoundException.java
│   │   │   │   ├── DuplicateCommentException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── mapper/
│   │   │   │   └── CommentMapper.java
│   │   │   ├── repository/
│   │   │   │   └── CommentRepository.java
│   │   │   └── service/
│   │   │       └── CommentService.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       ├── java/com/biblio/commentservice/
│       │   ├── CommentServiceApplicationTests.java
│       │   ├── controller/
│       │   │   └── CommentControllerTest.java
│       │   ├── integration/
│       │   │   └── CommentIntegrationTest.java
│       │   ├── repository/
│       │   │   └── CommentRepositoryTest.java
│       │   └── service/
│       │       └── CommentServiceTest.java
│       └── resources/
│           └── application-test.properties
└── pom.xml
```
