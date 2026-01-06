# Secure Digital Document and Workflow Management System

A highly secure, full-stack document management system built for a University Computer System Security course. It strictly enforces **MAC**, **DAC**, **RBAC**, **RuBAC**, and **ABAC**.

## Tech Stack
- **Backend**: Django 6.0, Django REST Framework
- **Frontend**: Next.js 16 (App Router), TailwindCSS (Premium UI)
- **Database**: PostgreSQL
- **Security**: JWT Authentication, Multi-Factor Authentication (OTP ready), Middleware Audit Logging

## Security Features
1.  **Mandatory Access Control (MAC)**: Confidentiality levels (Public < Internal < Confidential) checked against User Clearance.
2.  **Discretionary Access Control (DAC)**: Owners have full control but **cannot self-approve** workflows (Separation of Duties).
3.  **Role-Based Access Control (RBAC)**: Roles (Creator, Reviewer, Approver) dictate workflow actions.
4.  **Rule-Based Access Control (RuBAC)**: Time (8am-5pm UTC) and IP-based restrictions.
5.  **Attribute-Based Access Control (ABAC)**: Dynamic JSON policies (e.g., Department checks).

## Setup Instructions

### Backend (Django)
1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run migrations:
    ```bash
    python manage.py migrate
    ```
4.  Start server:
    ```bash
    python manage.py runserver
    ```
   
### Frontend (Next.js)
1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```

### Docker (Recommended)
You can run the entire secure stack using Docker Compose:
1.  **Build and Start**:
    ```bash
    docker-compose up --build
    ```
2.  **Run Migrations (Initial Setup)**:
    ```bash
    docker-compose exec backend python manage.py migrate
    ```
3.  **Access**:
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)
    - Swagger: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

## Documentation & API
- **Swagger UI**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **ReDoc**: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin) (Frontend)

## Verification
Run the included verification scripts to valditate security models:
```bash
cd backend
export PYTHONPATH=$PYTHONPATH:.
python access_control/tests_verification.py
python workflows/tests_verification.py
python tests_integration.py
python admin_verification.py
python mfa_verification.py
python security_gaps_verification.py
```

### Docker Verification
Once containers are running:
```bash
docker-compose exec backend python security_gaps_verification.py
```
