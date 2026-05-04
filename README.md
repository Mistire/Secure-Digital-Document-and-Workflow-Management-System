# Secure Digital Document and Workflow Management System

A highly secure, full-stack document management system built for a University Computer System Security course. It enforces **MAC**, **DAC**, **RBAC**, **RuBAC**, and **ABAC** access control models, with a complete secure authentication layer including JWT, Google OAuth 2.0, and TOTP-based MFA.

## How to Run

**Prerequisites**: Docker and Docker Compose installed.

```bash
# 1. Clone the repo
git clone <repo-url>
cd Secure-Digital-Document-and-Workflow-Management-System

# 2. Configure environment — set your Google Client ID and email credentials
cp .env.example .env   # or edit .env directly

# 3. Build and start all services (backend, frontend, database)
docker compose up --build

# 4. Run migrations (first time only)
docker compose exec backend python manage.py migrate

# 5. (Optional) Create a superuser for the admin panel
docker compose exec backend python manage.py createsuperuser
```

| Service | URL |
| ------- | --- |
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8001/api/` |
| Swagger docs | `http://localhost:8001/api/docs/` |
| Admin panel | `http://localhost:3000/admin` |

> To stop: `docker compose down`
> To wipe the database volume: `docker compose down -v`

---

## Tech Stack

- **Backend**: Django 6.0, Django REST Framework
- **Frontend**: Next.js 16 (App Router, React 19), TailwindCSS
- **Database**: PostgreSQL 15
- **Authentication**: JWT (SimpleJWT), Google OAuth 2.0, TOTP-based MFA
- **Security**: Brute-force protection (django-axes), reCAPTCHA v2, Audit Logging, Multi-layer Access Control

## Authentication Features

- JWT access tokens (30 min) and refresh tokens (1 day) with custom claims
- Google OAuth 2.0 social login
- TOTP-based Multi-Factor Authentication (Google Authenticator / Authy)
- Email verification on registration
- reCAPTCHA v2 bot protection
- Brute-force lockout after 5 failed attempts (django-axes)
- Real-time password strength validation

## Security Features

1. **Mandatory Access Control (MAC)**: Confidentiality levels (Public < Internal < Confidential) checked against user clearance level.
2. **Discretionary Access Control (DAC)**: Owners have full control but cannot self-approve workflows (Separation of Duties).
3. **Role-Based Access Control (RBAC)**: Roles (Creator, Reviewer, Approver) dictate workflow actions.
4. **Rule-Based Access Control (RuBAC)**: Time (8am–5pm UTC) and IP-based restrictions.
5. **Attribute-Based Access Control (ABAC)**: Dynamic JSON policies (e.g., department checks).

## Setup Instructions

### Environment Variables

Copy the root `.env` and fill in your values:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Docker (Recommended)

```bash
docker compose up --build
docker compose exec backend python manage.py migrate
```

Access points:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001/api/`
- Swagger docs: `http://localhost:8001/api/docs/`

### Backend (Manual)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (Manual)

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

- **Swagger UI**: `http://localhost:8001/api/docs/`
- **ReDoc**: `http://localhost:8001/api/redoc/`
- **Admin Panel**: `http://localhost:3000/admin`

## Auth Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/register/` | Register with email verification |
| POST | `/api/auth/login/` | Login (supports MFA OTP field) |
| POST | `/api/auth/token/refresh/` | Refresh JWT access token |
| GET/POST | `/api/auth/verify-email/` | Verify email address |
| POST | `/api/auth/google/` | Google OAuth 2.0 login |
| GET | `/api/auth/mfa/setup/` | Get TOTP QR code and secret |
| POST | `/api/auth/mfa/verify/` | Enable MFA after verifying code |

## Verification Scripts

```bash
cd backend
python access_control/tests_verification.py
python workflows/tests_verification.py
python tests_integration.py
python admin_verification.py
python mfa_verification.py
python security_gaps_verification.py
```

### Docker Verification

```bash
docker compose exec backend python security_gaps_verification.py
```
