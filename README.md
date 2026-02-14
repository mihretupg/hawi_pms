# Pharmacy Management System

Starter implementation using:

- Frontend: React + Tailwind CSS (Vite)
- Backend: FastAPI (Python)
- Database: PostgreSQL

## Features Included

- Dashboard stats (medicines, low stock, suppliers, total sales)
- Supplier CRUD (create + list)
- Medicine CRUD (create + list) + stock adjustment
- Sales transaction endpoint (reduces medicine stock)

## Project Structure

- `frontend/` React + Tailwind UI
- `backend/` FastAPI service with SQLAlchemy models
- `docker-compose.yml` PostgreSQL service

## 1) Start PostgreSQL

```bash
docker compose up -d
```

## 2) Run Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## 3) Run Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

## Notes

- Tables are auto-created on backend startup.
- This is a strong starter for expansion (auth, purchase orders, prescriptions, reports, audit logs).
