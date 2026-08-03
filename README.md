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

Initiate Database:

CREATE SEQUENCE team_directory_id_seq;

CREATE TABLE IF NOT EXISTS public.team_directory
(
    team_id integer,
    name text COLLATE pg_catalog."default",
    mobile text COLLATE pg_catalog."default",
    id integer NOT NULL DEFAULT nextval('team_directory_id_seq'::regclass),
    team_name text COLLATE pg_catalog."default",
    CONSTRAINT team_directory_pkey PRIMARY KEY (id)
)

SELECT setval('team_directory_id_seq', (SELECT MAX(id) FROM team_directory));
