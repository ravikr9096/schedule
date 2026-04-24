"""
Uvicorn entrypoint: allows running `python -m uvicorn api:app ...`

The FastAPI app object is defined in `main.py`.
"""

# region agent log
import json
import time

with open(r"c:\Users\ravik\Documents\schedule\debug-2b630d.log", "a", encoding="utf-8") as f:
    f.write(
        json.dumps(
            {
                "sessionId": "2b630d",
                "runId": "pre-fix",
                "hypothesisId": "H1",
                "location": "backend/app/api.py:import",
                "message": "api.py imported by uvicorn",
                "data": {},
                "timestamp": int(time.time() * 1000),
            }
        )
        + "\n"
    )
# endregion agent log

from main import app  # noqa: F401

