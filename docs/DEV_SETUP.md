# Development Environment Setup

This document describes how to set up, run, and maintain the development environment for the NestJS Template.

## Development Approaches

There are two primary approaches to running this application locally:

1. **Hybrid Development (Recommended)**: Backing services (`db`, `redis`, `minio`) run in Docker, while the NestJS application runs directly on your host machine.
2. **Full Containerized Development**: Everything, including the NestJS application, runs inside Docker containers.

### Why Hybrid Mode is Recommended

Running the NestJS application directly on your host machine is the recommended approach for daily development.

- **Speed and Performance**: Docker filesystem mounting on macOS and Windows can be slow, which increases hot-reload and build times. Running NestJS on the host provides native-speed compilation, leading to a much better Developer Experience (DX).
- **Easier Debugging**: You can easily attach debuggers, inspect processes, and run tests locally without having to bridge ports or exec into containers.

---

## 🏗️ Docker Files Explained

The project uses Docker to package dependencies and build production images. Here is the purpose of each file:

- **[docker-compose.yml](../docker-compose.yml)**: Defines the base services (`api`, `db`, `redis`, `minio`, and `minio-client`). The `api` service is assigned the `app` profile, which means it is excluded by default and only starts when requested.
- **[docker-compose.override.yml](../docker-compose.override.yml)**: Automatically loaded by Docker Compose in development. It exposes the service ports (`5432` for Postgres, `6379` for Redis, and `9000`/`9001` for MinIO) to your host machine so you can connect to them in Hybrid mode. It also overrides the container config for the API to run in watch mode.
- **[docker/Dockerfile](../docker/Dockerfile)**: Multi-stage build file used to compile and package the application for **production**. It produces a optimized minimal image running Node.js in alpine.
- **[docker/Dockerfile.dev](../docker/Dockerfile.dev)**: Lightweight development container configuration that sets up pnpm caching and uses the [docker-entrypoint.dev.sh](../docker/docker-entrypoint.dev.sh) script to install dependencies and run the NestJS dev server.

---

## 🛠️ Option 1: Hybrid Development (Recommended)

### 1. Configure your `.env` File

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the following:

- **Database & Redis Connection**: Since the app runs on your host machine and connects to Docker via exposed ports on `localhost`, set the hostnames to `localhost` or `127.0.0.1`:
  ```env
  DATABASE_URL="postgresql://nestjs_app:change-me@localhost:5432/nestjs_template"
  REDIS_URL="redis://:change-me@localhost:6379/0"
  ```
- **MinIO Endpoint**: When using MinIO locally, your browser client needs to download/upload assets. Set `AWS_S3_ENDPOINT_URL` to your **local host IP** (do not use `localhost` or `minio` because the browser outside of the docker network won't be able to resolve them):
  > [!TIP]
  > Run `ifconfig` (macOS/Linux) or `ipconfig` (Windows) to find your local network IP address (e.g., `192.168.1.15`).
  ```env
  AWS_S3_ENDPOINT_URL="http://<YOUR_LOCAL_IP>:9000"
  ```

### 2. Start the Backing Services

Run the following make command to spin up PostgreSQL, Redis, and MinIO:

```bash
make dev-hybrid
```

_(This runs `docker compose up --build`, which skips starting the `api` container because it belongs to the `app` profile.)_

### 3. Run NestJS Locally

In a new Terminal : Install dependencies and start the app in watch mode:

```bash
pnpm install
pnpm run start:dev
```

---

## 🐳 Option 2: Full Containerized Development

### 1. Configure your `.env` File

```bash
cp .env.example .env
```

Open `.env` and configure the hosts to match the docker network aliases:

- **Database & Redis Connection**: Connect using the container service names (`db` and `redis`):
  ```env
  DATABASE_URL="postgresql://nestjs_app:change-me@db:5432/nestjs_template"
  REDIS_URL="redis://:change-me@redis:6379/0"
  ```
- **MinIO Endpoint**:
  ```env
  AWS_S3_ENDPOINT_URL="http://minio:9000"
  ```

### 2. Start Everything

Run the following command to start both the NestJS application and the backing services inside Docker:

```bash
make dev
```

_(This runs `docker compose --profile app up --build` to enable the `api` container.)_

---

## 🔄 Database Migrations (Prisma)

This project uses [Prisma ORM](https://www.prisma.io/) to manage the database schema. Migration commands are defined as scripts in [package.json](../package.json).

### Running Migrations Locally (Hybrid Mode) TESTED ✅

When running in Hybrid mode, execute these commands in your host terminal:

1. **`pnpm run prisma:migrate:dev`**
   - **What it does**: Maps to `prisma migrate dev`. It reads the Prisma schema, compares it with your local database, creates a new SQL migration file (if there are changes), and applies all outstanding migrations to your database. It also triggers `prisma generate` automatically.
2. **`pnpm run prisma:generate`**
   - **What it does**: Maps to `prisma generate`. It compiles/generates the TypeScript Prisma Client based on your [schema.prisma](../src/prisma/schema.prisma) file. This gives you full type safety for database operations.
3. **`pnpm run prisma:studio`**
   - **What it does**: Maps to `prisma studio`. Launches a visual database GUI at `http://localhost:5555` to browse and edit data interactively.

### Running Migrations inside Docker (Full Mode)

If running everything inside containerized mode, execute the migrations inside the running API container:

```bash
make db-migrate
```

---

## 📄 API Documentation

The application comes with built-in Swagger/OpenAPI documentation.

Once your application is running (either in Hybrid or Full containerized mode), you can view and interact with the API endpoints by navigating to:

- **URL**: `http://localhost:<PORT>/api/v1/docs` (e.g. [http://localhost:8001/api/v1/docs](http://localhost:8001/api/v1/docs) if using the default port `8001` configured in `.env`).
- **Format**: It uses a clean Scalar interface for modern and interactive API references.
