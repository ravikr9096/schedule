## FastAPI + React skeleton

### Structure

- `backend/`: FastAPI app (Python)
- `frontend/`: React app (Vite + TypeScript)

### Run backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

### Endpoints

- Backend: `GET /health`, `GET /api/hello`
- Frontend: loads data from `GET /api/hello`

