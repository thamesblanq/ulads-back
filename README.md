Markdown

# ULADS Backend API

The centralized backend server for the University of Lagos Association of Dental Students (ULADS) platform. Built with NestJS, TypeScript, and Neon PostgreSQL, featuring robust authentication, secure account state recovery, and an automated global audit log.

## Features

- **Strict TypeScript Security:** Zero `any` compiler bypasses, strong controller-to-service interfaces.
- **Stateful JWT Authentication:** Secure registration, login, and token-based self-service actions using Passport.js.
- **3-Tier Role-Based Access Control (RBAC):** Granular endpoint security utilizing `user`, `admin`, and `superadmin` permission levels.
- **Automated Logging Interceptor:** Captures response execution times, routes, status codes, and active user contexts (with roles), persistently logging them to NeonDB for frontend administrative visibility.
- **Password Lifecycle Management:** Secure token generation and integrated password recovery via Nodemailer sandbox environments.
- **Global Error Handling:** Complete defensive error sanitization preventing raw SQL/DB schema leakage to the client interface.

---

## Tech Stack

- **Framework:** NestJS (v10+)
- **Runtime:** Node.js
- **Database:** Neon PostgreSQL (Serverless)
- **Authentication:** Passport.js, JWT (`@nestjs/jwt`), Argon2 (Hashing)
- **Email Delivery:** Nodemailer

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- `pnpm` (Preferred package manager)

### Installation

1. Clone the repository and navigate to the project directory.
2. Install the application dependencies:
   ```bash
   pnpm install
   Configuration
   Create a .env file in the root directory and populate it with your environment variables:
   ```

Code snippet
PORT=3000
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_64_byte_cryptographic_secret

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM="<noreply@ulads.edu>"

FRONTEND_URL="<http://localhost:5173>"
Running the Application
Bash

# Development mode with hot-reloading

pnpm run start:dev

# Production build

pnpm run build
pnpm run start:prod
API Specification Reference
Interactive Swagger documentation is available at <http://localhost:3000/api> when running the development server.

1. Authentication & Recovery (/auth)
   POST /auth/login (Public)
   Authenticates a member and issues a bearer access token (containing user ID, email, and role).

POST /auth/forgot-password (Public)
Generates a unique 32-character hexadecimal token, assigns an expiration timestamp (+1 hour), and transmits a password reset link to the user's inbox.

POST /auth/reset-password (Public)
Validates the token extracted from the recovery email and updates the member's security credentials.

2. User Management (/users)
   Tier 1: Standard Users (Requires basic JWT)
   POST /users (Public) - Registers a new platform user profile. Defaults to user role.

PATCH /users/complete-profile - Fills in vital academic records. Marks profile configuration complete.

PATCH /users/me - Performs a partial update of mutable fields for the authenticated context.

DELETE /users/me - Triggers a soft delete (is_active = false). Revokes login rights while keeping audit history intact.

GET /users/:id - Fetches public metadata parameters for a specific profile UUID.

Tier 2: Senate Administration (Requires admin or superadmin role)
GET /users - Retrieves a complete array of all registered platform members.

Tier 3: Executive Control (Requires superadmin role)
DELETE /users/:id/hard-delete - Bypasses soft-delete protections to permanently wipe a user record from the relational database.

Observability & Audit Logs
Every incoming request passes through a global LoggingInterceptor. The metadata is simultaneously broadcasted to the terminal console (displaying Email and Role) and permanently stored inside the activity_logs schema table for future administrator metrics evaluation:

SQL
CREATE TABLE activity_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID,
method TEXT NOT NULL,
url TEXT NOT NULL,
status_code INTEGER NOT NULL,
response_time_ms INTEGER NOT NULL,
ip_address TEXT,
created_at TIMESTAMP DEFAULT NOW()
);
