# Assignment Submission: Secure Authentication System

**Course**: Computer System Security
**Student**: Mistire Daniel
**Email**: mistire@10academy.org
**Date**: May 2026

---

## Overview

This submission documents the implementation of a **Secure Authentication System** built as part of the Secure Digital Document and Workflow Management System (SDWMS). The system uses React (Next.js), Django (Node-compatible REST backend), JWT, and Google OAuth 2.0 as required by the assignment.

---

## Tools and Technologies Used

| Tool / Technology | Role |
| ----------------- | ---- |
| Next.js 16 (React 19) | Frontend framework |
| Django 6.0 + DRF | Backend REST API |
| PostgreSQL 15 | Database |
| JWT (SimpleJWT) | Stateless authentication tokens |
| Google OAuth 2.0 | Social login via `@react-oauth/google` |
| TOTP (pyotp) | Multi-Factor Authentication |
| django-axes | Brute-force protection |
| reCAPTCHA v2 | Bot protection on registration |
| Docker Compose | Containerized deployment |

---

## Implemented Features

### 1. User Registration

- Username, email, password, phone number, and department fields
- Real-time password strength validation (length, uppercase, lowercase, number, special character)
- reCAPTCHA v2 checkbox to block bots
- Email verification link sent on signup — account is inactive until verified
- Django password validators (similarity, min length, common passwords, numeric-only)

**[SCREENSHOT PLACEHOLDER — Registration form with password strength indicators]**

---

### 2. Email Verification

- On registration, a signed UID + token link is emailed to the user
- Clicking the link activates the account and redirects to login with a success message
- Expired or tampered links show an error page

**[SCREENSHOT PLACEHOLDER — Email verification success page]**

---

### 3. JWT-Based Login

- Users authenticate with username + password
- Backend issues a short-lived **access token** (30 min) and a **refresh token** (1 day)
- Tokens carry custom claims: `username`, `is_staff`, `is_superuser`, `department`, `clearance_level`, `mfa_enabled`
- Tokens are stored in browser cookies via `js-cookie`
- Axios request interceptor automatically attaches `Authorization: Bearer <token>` on every API call
- 401 responses clear tokens and redirect to login

**[SCREENSHOT PLACEHOLDER — Login page]**

---

### 4. Google OAuth 2.0 Login

- "Sign in with Google" button on the login page using the official `@react-oauth/google` library
- Frontend receives a Google ID token after the user authenticates with Google
- ID token is sent to `POST /api/auth/google/` on the backend
- Backend verifies the token against Google's `tokeninfo` endpoint, validates the audience (client ID), and checks that the email is verified
- If the user does not exist, a new account is created automatically with an unusable password
- The backend issues the same JWT pair as a normal login (with all custom claims), so the rest of the app works identically regardless of login method

**[SCREENSHOT PLACEHOLDER — Login page showing the Google button]**

**[SCREENSHOT PLACEHOLDER — Google OAuth consent screen]**

**[SCREENSHOT PLACEHOLDER — Dashboard after successful Google login]**

---

### 5. Multi-Factor Authentication (TOTP)

- Users can enable MFA from their dashboard settings
- Backend generates a TOTP secret and returns a QR code (base64 PNG) and a manual backup key
- User scans the QR code with Google Authenticator or Authy
- On the next login, the backend detects `mfa_enabled=True` and returns `MFA_REQUIRED` — the frontend then shows an OTP input field
- The 6-digit code is verified server-side using `pyotp.TOTP.verify()`

**[SCREENSHOT PLACEHOLDER — MFA setup page with QR code]**

**[SCREENSHOT PLACEHOLDER — Login page with OTP field visible]**

---

### 6. Brute-Force Protection

- Implemented using `django-axes`
- After **5 failed login attempts**, the account is locked for the cooloff period
- Lockout is tracked by both username and IP address
- Lock resets automatically on a successful login

**[SCREENSHOT PLACEHOLDER — Login error after failed attempts]**

---

### 7. Audit Logging

- A custom `AuditMiddleware` intercepts every request to `/api/`
- Logs: authenticated user, HTTP method, path, IP address, and response status code
- All entries are stored in the `AuditEntry` database table and visible in the admin panel

**[SCREENSHOT PLACEHOLDER — Audit log entries in admin panel]**

---

## Architecture Diagram

**[SCREENSHOT PLACEHOLDER — Architecture diagram showing frontend → backend → DB + Google OAuth flow]**

---

## Authentication Flow Diagrams

### Standard Login Flow

```
User → POST /api/auth/login/ (username + password [+ OTP if MFA])
     → Django validates credentials via django-axes (rate limit check)
     → If MFA enabled: verify TOTP code
     → Issue JWT access token + refresh token (with custom claims)
     → Frontend stores tokens in cookies
     → Redirect to /dashboard
```

### Google OAuth Flow

```
User → Click "Sign in with Google"
     → Google consent screen
     → Google returns ID token to frontend
     → Frontend POST /api/auth/google/ { credential: <id_token> }
     → Backend verifies token via oauth2.googleapis.com/tokeninfo
     → Create user if new (unusable password, active account)
     → Issue JWT access token + refresh token (same format as standard login)
     → Frontend stores tokens in cookies
     → Redirect to /dashboard
```

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `backend/users/views.py` | `RegisterView`, `CustomTokenObtainPairView`, `GoogleAuthView` |
| `backend/users/serializers.py` | `CustomTokenObtainPairSerializer` with custom JWT claims |
| `backend/users/mfa_views.py` | `MFASetupView`, `MFAVerifyView` |
| `backend/users/urls.py` | All `/api/auth/*` route definitions |
| `backend/config/settings.py` | JWT config, CORS, axes, reCAPTCHA, Google client ID |
| `frontend/lib/auth.ts` | `login()`, `googleLogin()`, `logout()`, `getUser()` helpers |
| `frontend/lib/api.ts` | Axios instance with token injection and 401 handling |
| `frontend/app/(auth)/login/page.tsx` | Login page with Google OAuth button |
| `frontend/components/auth/RegisterForm.tsx` | Registration form with reCAPTCHA and password validation |
| `frontend/app/dashboard/mfa/page.tsx` | MFA setup page |
| `docker-compose.yml` | Full stack container configuration |

---

## Security Considerations

- Passwords hashed with Django's default PBKDF2 + salt
- Google OAuth tokens verified server-side (not trusted from frontend alone)
- Short-lived access tokens limit the window of token theft
- `GOOGLE_CLIENT_ID` audience check prevents tokens from other apps being accepted
- New Google OAuth users are created with `set_unusable_password()` so they cannot log in with a password

---

## How to Run

```bash
# Clone the repo and set up .env with your Google Client ID
docker compose up --build
docker compose exec backend python manage.py migrate
```

Open `http://localhost:3000` to access the application.
