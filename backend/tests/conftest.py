import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SEED_ON_STARTUP"] = "0"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as c:  # runs lifespan -> create_all
        yield c
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def published_form(client):
    """A published form with one of each question type."""
    form = client.post("/api/forms", json={"title": "Test"}).json()
    questions = [
        {"type": "short_text", "title": "Name", "required": True},
        {"type": "email", "title": "Email", "required": True},
        {"type": "multiple_choice", "title": "Pick", "required": True,
         "options": [{"label": "A"}, {"label": "B"}]},
        {"type": "rating", "title": "Rate", "properties": {"steps": 5}},
        {"type": "number", "title": "Age", "properties": {"min": 0, "max": 120}},
        {"type": "yes_no", "title": "Agree?"},
    ]
    form = client.put(f"/api/forms/{form['id']}/questions", json={"questions": questions}).json()
    client.post(f"/api/forms/{form['id']}/publish")
    return form
