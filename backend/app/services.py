"""Business logic. Routers stay thin and call into these functions."""

import csv
import io
import secrets
import string
from collections import Counter

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    CHOICE_TYPES,
    Answer,
    Form,
    FormStatus,
    Question,
    QuestionOption,
    QuestionType,
    Response,
    utcnow,
)
from .schemas import (
    AnswerOut,
    FormListItem,
    FormSummary,
    OptionIn,
    QuestionIn,
    QuestionSummary,
    ResponseOut,
    SubmissionIn,
)
from .validation import AnswerError, clean_answer

SLUG_ALPHABET = string.ascii_letters + string.digits
SLUG_LENGTH = 8


# ---------- Forms ----------

def generate_slug(db: Session) -> str:
    """Random 8-character public id, like Typeform's /to/AbC123xY links."""
    while True:
        slug = "".join(secrets.choice(SLUG_ALPHABET) for _ in range(SLUG_LENGTH))
        if not db.scalar(select(Form.id).where(Form.slug == slug)):
            return slug


def get_form_or_404(db: Session, form_id: int) -> Form:
    form = db.get(Form, form_id)
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def get_published_form_or_404(db: Session, slug: str) -> Form:
    form = db.scalar(
        select(Form).where(Form.slug == slug, Form.status == FormStatus.published)
    )
    if form is None:
        raise HTTPException(status_code=404, detail="This form is not accepting responses")
    return form


def list_forms(db: Session) -> list[FormListItem]:
    forms = db.scalars(select(Form).order_by(Form.updated_at.desc())).all()
    counts = dict(
        db.execute(
            select(Response.form_id, func.count(Response.id))
            .where(Response.submitted_at.is_not(None))
            .group_by(Response.form_id)
        ).all()
    )
    items = []
    for form in forms:
        item = FormListItem.model_validate(form)
        item.response_count = counts.get(form.id, 0)
        item.question_count = len(form.questions)
        items.append(item)
    return items


def duplicate_form(db: Session, form: Form) -> Form:
    copy = Form(
        title=f"{form.title} (copy)",
        slug=generate_slug(db),
        status=FormStatus.draft,
        theme=dict(form.theme or {}),
        thank_you=dict(form.thank_you or {}),
    )
    for q in form.questions:
        copy.all_questions.append(
            Question(
                position=q.position,
                type=q.type,
                title=q.title,
                description=q.description,
                required=q.required,
                properties=dict(q.properties or {}),
                options=[QuestionOption(position=o.position, label=o.label) for o in q.options],
            )
        )
    db.add(copy)
    return copy


def publish_form(form: Form) -> None:
    if not form.questions:
        raise HTTPException(status_code=400, detail="Add at least one question before publishing")
    form.status = FormStatus.published


# ---------- Builder: saving the question list ----------

def sync_questions(db: Session, form: Form, incoming: list[QuestionIn]) -> None:
    """Make the form's live questions match `incoming` exactly.

    - Items with an id update that question; items without an id are created.
    - List order becomes `position`, which is how drag-and-drop reordering is saved.
    - Live questions missing from the list are soft-deleted, so old answers keep working.
    """
    live = {q.id: q for q in form.all_questions if q.deleted_at is None}
    kept_ids: set[int] = set()

    for position, data in enumerate(incoming):
        if data.id is not None:
            question = live.get(data.id)
            if question is None:
                raise HTTPException(
                    status_code=400, detail=f"Question {data.id} does not belong to this form"
                )
            kept_ids.add(question.id)
        else:
            question = Question()
            form.all_questions.append(question)

        question.position = position
        question.type = data.type
        question.title = data.title
        question.description = data.description
        question.required = data.required
        question.properties = dict(data.properties)
        _sync_options(question, data.options if data.type in CHOICE_TYPES else [])

    now = utcnow()
    for question_id, question in live.items():
        if question_id not in kept_ids:
            question.deleted_at = now
    form.updated_at = now


def _sync_options(question: Question, incoming: list[OptionIn]) -> None:
    existing = {o.id: o for o in question.options}
    result = []
    for position, data in enumerate(incoming):
        if data.id is not None:
            option = existing.get(data.id)
            if option is None:
                raise HTTPException(
                    status_code=400, detail=f"Option {data.id} does not belong to this question"
                )
        else:
            option = QuestionOption()
        option.position = position
        option.label = data.label.strip()
        result.append(option)
    # Options left out are deleted (delete-orphan). Answers that pointed at them
    # keep their label snapshot; the DB sets their option_id to NULL.
    question.options = result


# ---------- Respondent submissions ----------

def start_response(db: Session, form: Form) -> Response:
    """Record that someone started the form (pressed Start)."""
    response = Response(form_id=form.id, started_at=utcnow())
    db.add(response)
    return response


def _started_response(db: Session, form: Form, response_id: int | None) -> Response | None:
    """The unfinished response this submission completes, if it's valid."""
    if response_id is None:
        return None
    response = db.get(Response, response_id)
    if response is None or response.form_id != form.id or response.submitted_at is not None:
        return None
    return response

def submit_response(db: Session, form: Form, submission: SubmissionIn) -> Response:
    questions = {q.id: q for q in form.questions}
    raw_by_question = {}
    errors: dict[str, str] = {}

    for answer in submission.answers:
        if answer.question_id not in questions:
            errors[str(answer.question_id)] = "Unknown question"
        else:
            raw_by_question[answer.question_id] = answer.value

    cleaned = []
    for question in form.questions:
        try:
            result = clean_answer(question, raw_by_question.get(question.id))
        except AnswerError as exc:
            errors[str(question.id)] = str(exc)
            continue
        if result is not None:
            cleaned.append((question, result))

    if errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Some answers need your attention", "errors": errors},
        )

    now = utcnow()
    response = _started_response(db, form, submission.response_id)
    if response is None:
        # No valid start record (e.g. an old client): create the response now.
        response = Response(form_id=form.id, started_at=submission.started_at or now)
        db.add(response)
    response.submitted_at = now
    response.answers = [
        Answer(
            question_id=question.id,
            option_id=c.option_id,
            value_text=c.value_text,
            value_number=c.value_number,
        )
        for question, c in cleaned
    ]
    return response


# ---------- Results ----------

def to_response_out(response: Response) -> ResponseOut:
    return ResponseOut(
        id=response.id,
        started_at=response.started_at,
        submitted_at=response.submitted_at,
        answers=[
            AnswerOut(question_id=a.question_id, question_title=a.question.title, value=a.value)
            for a in response.answers
        ],
    )


def submitted_responses(db: Session, form: Form) -> list[Response]:
    return list(
        db.scalars(
            select(Response)
            .where(Response.form_id == form.id, Response.submitted_at.is_not(None))
            .order_by(Response.submitted_at.desc())
        ).all()
    )


def build_summary(db: Session, form: Form) -> FormSummary:
    responses = submitted_responses(db, form)
    total = len(responses)
    started = db.scalar(select(func.count(Response.id)).where(Response.form_id == form.id)) or 0

    answers_by_question: dict[int, list[Answer]] = {}
    for response in responses:
        for answer in response.answers:
            answers_by_question.setdefault(answer.question_id, []).append(answer)

    summaries = []
    for question in form.questions:
        answers = answers_by_question.get(question.id, [])
        summaries.append(
            QuestionSummary(
                question_id=question.id,
                title=question.title,
                type=question.type,
                answered=len(answers),
                skipped=total - len(answers),
                stats=_question_stats(question, answers),
            )
        )

    return FormSummary(
        total_responses=total,
        total_started=started,
        completion_rate=round(100 * total / started, 1) if started else 0.0,
        questions=summaries,
    )


def _percent(count: int, total: int) -> float:
    return round(100 * count / total, 1) if total else 0.0


def _question_stats(question: Question, answers: list[Answer]) -> dict:
    n = len(answers)

    if question.type in CHOICE_TYPES:
        counts = Counter(a.option_id for a in answers)
        return {
            "options": [
                {"option_id": o.id, "label": o.label,
                 "count": counts[o.id], "percent": _percent(counts[o.id], n)}
                for o in question.options
            ]
        }

    if question.type == QuestionType.yes_no:
        counts = Counter(a.value_text for a in answers)
        return {
            "options": [
                {"label": label.capitalize(), "count": counts[label],
                 "percent": _percent(counts[label], n)}
                for label in ("yes", "no")
            ]
        }

    if question.type == QuestionType.rating:
        steps = int((question.properties or {}).get("steps", 5))
        counts = Counter(int(a.value_number) for a in answers)
        return {
            "average": round(sum(a.value_number for a in answers) / n, 2) if n else None,
            "distribution": [
                {"rating": r, "count": counts[r], "percent": _percent(counts[r], n)}
                for r in range(1, steps + 1)
            ],
        }

    if question.type == QuestionType.number:
        values = [a.value_number for a in answers]
        return {
            "average": round(sum(values) / n, 2) if n else None,
            "min": min(values) if values else None,
            "max": max(values) if values else None,
        }

    # short_text, long_text, email: show the most recent answers.
    return {"latest": [a.value_text for a in answers[:5]]}


def export_csv(db: Session, form: Form) -> str:
    questions = form.questions
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Response ID", "Submitted at", *[q.title for q in questions]])
    for response in submitted_responses(db, form):
        by_question = {a.question_id: a.value for a in response.answers}
        writer.writerow([
            response.id,
            response.submitted_at.isoformat() if response.submitted_at else "",
            *["" if by_question.get(q.id) is None else by_question[q.id] for q in questions],
        ])
    return buffer.getvalue()
