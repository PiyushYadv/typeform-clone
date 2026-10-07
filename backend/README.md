# Backend — Typeform Clone API

FastAPI + SQLAlchemy 2.0 + SQLite.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The database is created and seeded automatically on first start
(two published forms with responses, one draft). Interactive API docs
are at http://localhost:8000/docs.

Reset the seed data: `python -m app.seed --reset`
Run tests: `pytest`

## Structure

```
app/
  main.py        app setup, CORS, startup (create tables + seed)
  database.py    engine, session, SQLite foreign keys
  models.py      database schema
  schemas.py     request/response shapes
  validation.py  per-question-type answer validation
  services.py    business logic (routers stay thin)
  seed.py        sample data
  routers/
    forms.py     creator: CRUD, publish, duplicate, save questions
    results.py   creator: responses, summary, CSV export
    public.py    respondent: fetch published form, submit (no auth)
```

## Database schema

| Table | Columns | Notes |
|---|---|---|
| forms | id, title, slug (unique), status, theme, thank_you, created_at, updated_at | slug is the public link id |
| questions | id, form_id → forms, position, type, title, description, required, properties, deleted_at | soft-deleted so old answers survive |
| question_options | id, question_id → questions, position, label | for multiple choice and dropdown |
| responses | id, form_id → forms, started_at, submitted_at | submitted_at NULL = unfinished |
| answers | id, response_id → responses, question_id → questions, option_id → question_options, value_text, value_number | unique (response_id, question_id) |

Choice answers store both the option id and a copy of its label, so an
answer stays readable after its option is edited out.

## API

| Method | Path | Purpose |
|---|---|---|
| GET / POST | /api/forms | list (with response counts) / create |
| GET / PATCH / DELETE | /api/forms/{id} | read / rename, theme, thank-you / delete |
| POST | /api/forms/{id}/duplicate | copy as a new draft |
| POST | /api/forms/{id}/publish, /unpublish | toggle public link |
| PUT | /api/forms/{id}/questions | save the whole builder state (add, edit, reorder, delete) |
| GET | /api/forms/{id}/responses, /responses/{rid} | results |
| GET | /api/forms/{id}/summary | per-question stats, completion rate |
| GET | /api/forms/{id}/export.csv | CSV export |
| GET | /api/public/forms/{slug} | respondent: published form only |
| POST | /api/public/forms/{slug}/responses | respondent: submit (validated server-side, 422 with per-question errors) |

## Assumptions

- A single default creator; no creator auth (allowed by the brief).
- Multiple choice is single-select.
- Published forms stay editable, as in Typeform.
