# IT Support Ticket System (Spring Boot + Next.js)

Monorepo containing a Spring Boot backend API and a Next.js 15 frontend for managing support tickets, users, comments, and admin operations.

## Stack

- Backend: Spring Boot 3, Java 17, Spring Security (JWT), Spring Data JPA, PostgreSQL, Flyway (optional), springdoc-openapi
- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Database: PostgreSQL (dev defaults to local instance)

## Repository Structure

```
.
├─ backend/   # Spring Boot API
│  ├─ src/main/java/com/codelogium/ticketing
│  ├─ src/main/resources
│  ├─ database/                # SQL setup helpers
│  ├─ setup-database.(bat|sh)  # DB bootstrap scripts (local or Docker)
│  └─ README.md
└─ frontend/  # Next.js app
   ├─ src/app
   ├─ src/components
   ├─ src/services
   └─ README.md
```

---

## Quick Start

### 1) Prerequisites

- Java 17+
- Node.js 18+ and npm
- PostgreSQL 14+ (or use the provided Docker option)

### 2) Set up the database

Use the helper script (creates DB `ticketing_system` and user `ticketing_user`):

- Windows (PowerShell):

```powershell
cd backend
./setup-database.bat           # or: ./setup-database.bat --docker
```

- macOS/Linux:

```bash
cd backend
chmod +x ./setup-database.sh
./setup-database.sh            # or: ./setup-database.sh --docker
```

Alternatively, run SQL manually: `backend/database/setup.sql`.

Database defaults (configurable):

- Host: `localhost:5432`
- DB: `ticketing_system`
- User: `ticketing_user`
- Password: `ticketing_password`

### 3) Run the backend (port 8080)

From `backend/`:

- Windows:

```powershell
./mvnw spring-boot:run
```

- macOS/Linux:

```bash
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

Useful endpoints:

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

Default dev admin (auto-created):

- Email: `admin@ticketing.com`
- Password: `admin123`

You can change these in `backend/src/main/resources/application-dev.properties`:

```
app.admin.email=admin@ticketing.com
app.admin.password=admin123
app.admin.create-on-startup=true
```

Backend profiles:

- Default active: `dev` (see `backend/src/main/resources/application.properties`)
- Switch to prod: `./mvnw spring-boot:run -Dspring-boot.run.profiles=prod`
  - In `prod`, DB settings are read from `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` env vars.

Run tests:

```bash
./mvnw test
```

### 4) Run the frontend (port 3000)

From `frontend/`:

1. Create `.env.local` with backend URL (optional; default is `http://localhost:8080`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

PowerShell one-liner:

```powershell
Set-Content -Path .env.local -Value "NEXT_PUBLIC_API_URL=http://localhost:8080"
```

2. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

Frontend scripts:

- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build
- `npm start` — start production server
- `npm run lint` — run ESLint

---

## How the apps talk to each other

- The frontend calls the backend at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`).
- Authentication uses JWT; tokens are stored in cookies (`jwt_token`) for server-side usage and in localStorage for certain client flows.

---

## Configuration Reference

### Backend

- Active profile: `dev` by default. Override with `SPRING_PROFILES_ACTIVE` or `-Dspring-boot.run.profiles`.
- Dev DB (from `application-dev.properties`):
  - `spring.datasource.url=jdbc:postgresql://localhost:5432/ticketing_system`
  - `spring.datasource.username=ticketing_user`
  - `spring.datasource.password=ticketing_password`
- Prod DB (from `application-prod.properties`):
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` env vars
- OpenAPI: path `/api-docs` with Swagger UI at `/swagger-ui/index.html`

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend base URL (e.g., `http://localhost:8080`)

---

## Common Issues

- Database connection errors: ensure PostgreSQL is running locally or use the `--docker` option in the setup scripts.
- 401/403 after login: token may be missing/expired. Log in again; ensure cookies are enabled and backend is reachable from the browser at `NEXT_PUBLIC_API_URL`.

---

## Deployment Notes

- Backend: supply `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and set `SPRING_PROFILES_ACTIVE=prod`.
- Frontend: set `NEXT_PUBLIC_API_URL` to the deployed backend URL; then `npm run build && npm start` (or deploy via a platform like Vercel).

---

## License

MIT
