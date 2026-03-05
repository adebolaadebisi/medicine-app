# FastAPI Backend

## Setup
1. Create venv:
   `python -m venv .venv`
2. Activate venv (PowerShell):
   `.venv\Scripts\Activate.ps1`
3. Install dependencies:
   `pip install -r requirements.txt`
4. Copy env file:
   `Copy-Item .env.example .env`

## Run
`uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

## Endpoints
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)
- `GET /doctors`
- `POST /food-checks` (Bearer token)
- `GET /food-checks` (Bearer token)
- `POST /meal-plans` (Bearer token)
- `GET /meal-plans` (Bearer token)
- `POST /admin/users/reset-password` (Admin bearer token)
- `GET /timeline` (Bearer token)
- `POST /appointments` (Bearer token)
- `GET /appointments` (Bearer token)
- `PATCH /appointments/{id}/cancel` (Bearer token)
- `PATCH /appointments/{id}/reschedule` (Bearer token)
- `GET /appointments/admin` (Admin bearer token)
- `PATCH /appointments/admin/{id}` (Admin bearer token)
- `GET /notifications` (Bearer token)
- `GET /notifications/unread-count` (Bearer token)
- `PATCH /notifications/{id}/read` (Bearer token)
- `PATCH /notifications/read-all` (Bearer token)
- `POST /vitals` (Bearer token)
- `GET /vitals` (Bearer token)
- `GET /vitals/trends` (Bearer token)
- `GET /vitals/flags` (Bearer token)
  - Critical vital flags are marked as emergency and generate `emergency_alert` notifications.
- `POST /caregiver-links/invite` (Bearer token)
- `GET /caregiver-links/mine` (Bearer token)
- `GET /caregiver-links/assigned` (Bearer token)
- `PATCH /caregiver-links/{id}/accept` (Bearer token)
- `PATCH /caregiver-links/{id}/revoke` (Bearer token)
- `GET /caregiver-links/patient/{patient_id}/overview` (Bearer token, active caregiver link required)
- `POST /medication-reminders` (Bearer token)
- `GET /medication-reminders` (Bearer token)
- `PATCH /medication-reminders/{id}` (Bearer token)
- `DELETE /medication-reminders/{id}` (Bearer token)
- `GET /medication-reminders/adherence` (Bearer token)
- `GET /medication-reminders/adherence/trend` (Bearer token)
- `POST /medication-reminders/{id}/adherence` (Bearer token)

## Notes
- Uses SQLite by default (`app.db` in this folder).
- CORS allows Vite dev URLs (`http://localhost:5173` and `http://127.0.0.1:5173`).
- Caregiver invites send email using `EMAIL_TRANSPORT`:
  - `console` (default) prints invite emails in backend logs.
  - `smtp` sends real emails using SMTP env vars.
- To be invited as caregiver, the user must register with `account_type=caregiver`.
