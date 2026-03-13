## Backend (FastAPI)

### Setup

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Run (dev)

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Quick check

- `GET /health` -> `{ "status": "ok" }`
- `GET /api/hello` -> `{ "message": "Hello from FastAPI" }`

