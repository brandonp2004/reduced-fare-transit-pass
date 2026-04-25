# Reduced-Fare Transit Pass

A full-stack transit eligibility and pass issuance application that simulates a government-style workflow for resident enrollment, admin review, pass issuance, and verifier validation.

## Overview

This project was built to demonstrate a realistic civic-tech style workflow rather than a generic CRUD app.

The system supports three roles:

- **Resident**: registers, logs in, submits reduced-fare applications, and views issued passes
- **Admin**: reviews applications, approves or rejects submissions, and manages issued passes
- **Verifier**: validates pass numbers and checks whether a pass is active and unexpired

The app uses server-side session authentication with HTTP-only cookies and role-protected backend routes.

---

## Features

### Resident
- Register and log in
- Submit reduced-fare applications
- View submitted applications and approval status
- View issued transit passes

### Admin
- Review all submitted applications
- Approve or reject applications
- Automatically issue passes on approval
- View all issued passes

### Verifier
- Verify pass validity by pass number
- Confirm whether a pass is active and not expired

### Security / Auth
- Password hashing with bcrypt
- Session authentication with HTTP-only cookies
- Persistent session restore on refresh
- Server-side route protection by role
- Resident identity tied to authenticated session instead of frontend email input

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- Go
- `net/http`
- `pgx`

### Database
- PostgreSQL

### Infrastructure
- Docker
- Docker Compose

---

## Architecture

### Frontend
The frontend is a React single-page application that:
- handles login and session restore
- presents role-specific views
- communicates with backend API endpoints
- renders resident, admin, and verifier workflows

### Backend
The Go backend:
- handles authentication and session management
- exposes role-protected API routes
- manages business logic for applications, passes, and verification
- interacts with PostgreSQL for persistent storage

### Database Tables
- `users`
- `applications`
- `passes`
- `sessions`

---

## Core Workflow

1. A resident registers and logs in
2. The resident submits a reduced-fare application
3. An admin reviews the application
4. If approved, the system issues a pass
5. The resident can view the issued pass
6. An admin or verifier can validate the pass number

---

## Screenshots

> Add your screenshots to `docs/screenshots/` and update these if needed.

### Resident dashboard
![Resident dashboard](docs/screenshots/resident-dashboard.png)

### Admin review queue
![Admin review queue](docs/screenshots/admin-review.png)

### Issued passes
![Issued passes](docs/screenshots/issued-passes.png)

### Verifier panel
![Verifier panel](docs/screenshots/verifier-panel.png)

---

## Local Setup

### 1. Start PostgreSQL

```powershell
cd infra/docker
docker compose up -d