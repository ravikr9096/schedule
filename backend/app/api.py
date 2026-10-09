"""
Uvicorn entrypoint: allows running `python -m uvicorn api:app ...`

The FastAPI app object is defined in `main.py`.
"""

import sys
from pathlib import Path

# Ensure the app directory is in sys.path
app_dir = str(Path(__file__).resolve().parent)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from main import app  # noqa: F401
__all__ = ["app"]

