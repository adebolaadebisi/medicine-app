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

## Notes
- Uses SQLite by default (`app.db` in this folder).
- CORS allows Vite dev URLs (`http://localhost:5173` and `http://127.0.0.1:5173`).
