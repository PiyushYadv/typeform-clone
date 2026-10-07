# Typeform Clone

A working clone of Typeform: build forms in a three-pane builder, publish them
to a public link, collect answers through the one-question-at-a-time flow,
and read the results.

| | |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Framer Motion, dnd-kit, Sonner |
| Backend | Python, FastAPI, SQLAlchemy 2.0, Pydantic 2 |
| Database | SQLite |
| Tests | pytest (API), Playwright walkthroughs during development |

## Run it locally

You need Python 3.11+ and Node 20+.

```bash
# 1. API on http://localhost:8000 (creates and seeds the database on first start)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. App on http://localhost:3000
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The seed data gives you two published forms with
responses and one draft. API docs: http://localhost:8000/docs.
Tests: `cd backend && pytest`. Reset data: `python -m app.seed --reset`.

## What's in it

**Builder.** Question list with drag-and-drop reordering, a canvas showing
the question exactly as respondents will see it (title, description and
choices edited in place), and a settings panel (type, required, rating
steps, number limits). Eight question types: short text, long text, multiple
choice, dropdown, email, number, yes/no, rating. Autosave, a full preview,
theme presets, an editable thank-you screen, publish/unpublish with a
shareable link.

**Workspace.** All forms with status, response count and last update;
create, rename, duplicate, delete, copy link.

**Respondent flow** (`/to/<slug>`, no login). Welcome screen, one question
at a time with direction-aware slide transitions, progress bar, up/down
navigation. Keyboard throughout: Enter, Shift+Enter, ↑/↓, letter keys for
choices, Y/N, number keys for ratings. Chosen options blink, then advance.
Validation on the client and again on the server, with Typeform's error
wording. Thank-you screen.

**Results.** Responses, started, completion rate and average completion
time; a summary card per question; a responses table; any single response
in full; CSV export.

**Bonus items done:** theme presets, CSV export, partial-response tracking
and completion rate. **Placeholders:** logic jumps, integrations, team
sharing, file upload and payment questions are shown as "Coming soon".

## Architecture

```
frontend/  Next.js app, talks to the API over JSON
  src/app/                 routes: /forms, /forms/[id]/create, /forms/[id]/results, /to/[slug]
  src/components/respondent/  the form-filling experience
  src/components/builder/     the builder (state and autosave in useFormEditor.ts)
  src/components/results/     the results views
  src/lib/                 API client, types, validation, theme

backend/
  app/routers/     HTTP layer, thin
  app/services.py  business logic
  app/validation.py  answer rules per question type
  app/models.py    schema
```

Two decisions shape the frontend:

- **One question component for everyone.** The builder canvas, the
  preview and the live form all render the same respondent components, so
  what a creator sees is what respondents get.
- **The builder edits a local draft and saves the whole ordered question
  list in one request.** List order is position, so reordering is just
  saving. New items carry a client key until the server returns their ids.

## Database schema

```
forms 1──* questions 1──* question_options
  │            │                 │
  1            1                 │ option_id (nullable, SET NULL)
  *            *                 │
responses 1──* answers ──────────┘
```

| Table | Columns | Notes |
|---|---|---|
| forms | id, title, slug (unique), status, theme (JSON), thank_you (JSON), created_at, updated_at | slug is the public link id |
| questions | id, form_id, position, type, title, description, required, properties (JSON), deleted_at | soft-deleted |
| question_options | id, question_id, position, label | choices for multiple choice and dropdown |
| responses | id, form_id, started_at, submitted_at | submitted_at is null until finished |
| answers | id, response_id, question_id, option_id, value_text, value_number | unique (response_id, question_id) |

- **Questions are soft-deleted**, so responses collected earlier keep their
  answers and still show which question they answered.
- **Choice answers store the option id and a copy of its label.** Counts use
  the id; the label keeps old answers readable after an option is edited out.
- **Numbers and ratings go in `value_number`** so they can be averaged in SQL;
  everything else in `value_text`.
- **A response row is created when someone presses Start** and completed on
  submit. That gives a real completion rate and completion time.
- Foreign keys cascade on delete (SQLite's foreign key enforcement is turned
  on per connection).

## API

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/api/forms` | List with response counts; create |
| GET, PATCH, DELETE | `/api/forms/{id}` | Read; rename / theme / thank-you; delete |
| POST | `/api/forms/{id}/duplicate` | Copy as a new draft |
| POST | `/api/forms/{id}/publish`, `/unpublish` | Turn the public link on or off |
| PUT | `/api/forms/{id}/questions` | Save the whole ordered question list (add, edit, reorder, delete) |
| GET | `/api/forms/{id}/responses`, `/responses/{rid}` | Submitted responses |
| GET | `/api/forms/{id}/summary` | Per-question stats, started count, completion rate |
| GET | `/api/forms/{id}/export.csv` | CSV export |
| GET | `/api/public/forms/{slug}` | A published form, for respondents |
| POST | `/api/public/forms/{slug}/start` | Respondent pressed Start |
| POST | `/api/public/forms/{slug}/responses` | Submit; 422 lists errors per question |

## Assumptions

- One default creator; no creator login, as the brief allows.
- Multiple choice is single-select.
- Edits to a published form go live as they save (Typeform holds them until
  you publish again).
- Answers are saved on submit; an abandoned response records that the person
  started, not what they had typed.
- Theme customisation is a set of presets; custom colors and fonts are a
  placeholder.

## Deploying

- **Frontend** (e.g. Vercel): set `NEXT_PUBLIC_API_URL` to the API's URL.
- **Backend** (e.g. Render or Railway): start command
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; set `FRONTEND_ORIGINS`
  to the frontend URL for CORS. SQLite lives on the server's disk: attach a
  persistent disk, or keep `SEED_ON_STARTUP=1` so a fresh disk starts with demo data.
