# ULADS Backend API

Backend server for the University of Lagos Association of Dental Students (ULADS) platform.

## Features

- **Authentication & Authorization:** Secure registration, login, and role-based access control.
- **Account Recovery:** Password reset flow with time-limited tokens.
- **Audit Logging:** Automated activity tracking for administrative oversight.
- **Error Handling:** Centralized error responses with no internal detail exposure.

---

## Tech Stack

- **Framework:** NestJS
- **Runtime:** Node.js
- **Database:** PostgreSQL
- **Authentication:** JWT, Argon2
- **Email:** Nodemailer

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- `pnpm`

### Installation

```bash
pnpm install
Configuration
Create a .env file in the root directory:

text
PORT=3000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@ulads.edu
FRONTEND_URL=http://localhost:5173
Running
bash
pnpm run start:dev     # Development
pnpm run build         # Production build
pnpm run start:prod    # Production start
API Overview
Full interactive documentation available at http://localhost:3000/api when running locally.

Authentication (/auth)
Method Endpoint Access Description
POST /auth/login Public Authenticate and receive access token
POST /auth/forgot-password Public Request password reset email
POST /auth/reset-password Public Reset password with valid token
Users (/users)
Method Endpoint Access Description
POST /users Public Register new account
PATCH /users/complete-profile Authenticated Complete academic profile
PATCH /users/me Authenticated Update own profile
DELETE /users/me Authenticated Deactivate own account
GET /users/:id Authenticated View user profile
GET /users Admin List all users
DELETE /users/:id Super Admin Remove user account
License
Private — University of Lagos Association of Dental Students.
```
