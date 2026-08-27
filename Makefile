.PHONY: dev dev-hybrid build down logs test test-e2e test-cov clean ps shell db-migrate

# Start the full containerized development environment
dev:
	docker compose --profile app up --build

# Start only the dependencies (db, redis, minio) for hybrid host-side development
dev-hybrid:
	docker compose up --build

# Stop the local development environment
down:
	docker compose down

# View live container logs
logs:
	docker compose logs -f

# Show status of containers
ps:
	docker compose ps

# Build the production Docker image
build:
	docker build -t nestjs-template:latest -f docker/Dockerfile .

# Run unit tests locally
test:
	pnpm run test

# Run end-to-end tests locally
test-e2e:
	pnpm run test:e2e

# Run test coverage locally
test-cov:
	pnpm run test:cov

# Access the API container's shell
shell:
	docker compose exec api sh

# Run database migrations inside the running API container
db-migrate:
	docker compose exec api pnpm run prisma:migrate:dev

# Clean up docker resources (containers, volumes, networks)
clean:
	docker compose down -v --rmi local
