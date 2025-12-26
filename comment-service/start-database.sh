#!/bin/bash

# Start the PostgreSQL database for local development
docker run -d \
  --name comment-db \
  -e POSTGRES_DB=commentdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5434:5432 \
  postgres:15-alpine

echo "PostgreSQL database for comment-service started on port 5434"
echo "Connection string: jdbc:postgresql://localhost:5434/commentdb"
