"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import forms, public, results
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # On hosts with ephemeral disks (e.g. Render free tier) the DB resets on
    # redeploy, so seeding on startup keeps the demo usable.
    if os.getenv("SEED_ON_STARTUP", "1") == "1":
        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(title="Typeform Clone API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(results.router)
app.include_router(public.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
