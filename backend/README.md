# IT Support Ticket System Backend

A Spring Boot backend for managing IT support tickets, users, comments, and admin operations.

## Features

- User registration, authentication (JWT)
- Role-based access: USER, ADMIN, SUPPORT_AGENT
- Ticket creation, update, assignment, status change
- Commenting on tickets
- Admin management of users and support agents
- Audit logging
- Pagination for list endpoints

## How to Run Locally

1. **Requirements:**
   - Java 17+
   - Maven 3.8+
   - PostgreSQL (or use H2 in-memory for testing)
2. **Setup:**
   - Clone the repository
   - Configure database in `src/main/resources/application.properties`
3. **Run:**
   ```bash
   mvn spring-boot:run
   ```
   The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication

- `POST /user/authenticate` — Login, returns JWT token
  - **Payload:** `{ "email": "user@example.com", "password": "..." }`
  - **Response:** `{ "token": "Bearer ...", "email": "...", "userId": 1, "authorities": ["USER"] }`

### Users

- `POST /users/register` — Register new user
- `GET /users/{userId}` — Get user info
- `DELETE /users/{userId}` — Delete user (authenticated)

### Tickets

- `POST /users/{userId}/tickets` — Create ticket
- `GET /users/{userId}/tickets` — List user's tickets (paginated)
- `PATCH /users/{userId}/tickets/{ticketId}/status` — Update ticket status (SUPPORT_AGENT/ADMIN)
- `PATCH /users/{userId}/tickets/{ticketId}/info` — Update ticket info (USER/ADMIN)

### Comments

- `POST /tickets/{ticketId}/comments` — Add comment
- `GET /tickets/{ticketId}/comments` — List comments

### Admin

- `GET /admin/users` — List all users (ADMIN)
- `DELETE /admin/users/{userId}` — Delete user (ADMIN)
- `POST /admin/create-support-agent` — Create support agent (ADMIN)

## Request Format

- All protected endpoints require `Authorization: Bearer <JWT_TOKEN>` header
- All payloads are JSON

## Responses

- Standard HTTP status codes
- Error responses:
  - `401 Unauthorized`: Invalid/missing JWT
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Resource not found
  - `500 Internal Server Error`: Unexpected error

## Development

- Swagger UI: `http://localhost:8080/swagger-ui/`
- H2 Console: `http://localhost:8080/h2-console` (if enabled)

## License

MIT License
