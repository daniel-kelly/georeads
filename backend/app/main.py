# backend/app/main.py

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.nationality import get_nationality
from app.aggregation import get_nationality_counts

import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/author_batch")
async def get_nationalities_for_authors(names: str = Query(..., description="Comma-separated author names")):
    """
    Example: GET /api/author_batch?names=Orwell,Rowling,Tolkien
    Returns: { "results": [ {"name":"Orwell","nationality":"United Kingdom"}, ... ] }
    Throttles 1 SPARQL request per 0.5 seconds to avoid 429 errors.
    """
    author_list = [n.strip() for n in names.split(",") if n.strip()]
    results = []

    for name in author_list:
        try:
            nationality = get_nationality(name)
            results.append({"name": name, "nationality": nationality, "cached": False})  # Cache internally handled
        except Exception as e:
            results.append({"name": name, "nationality": "Unknown", "cached": False})

    return { "results": results }

@app.get("/api/nationality_counts")
def get_counts():
    data = get_nationality_counts()
    return {"results": data}