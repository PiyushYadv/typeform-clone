"""Seed data so the app is usable immediately.

Creates two published forms with mixed question types and realistic
responses (including a few unfinished ones for completion rate), plus one
draft form.

Run manually:   python -m app.seed            (only if the DB is empty)
                python -m app.seed --reset    (wipe and reseed)
"""

import random
import sys
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Answer, Form, FormStatus, Question, QuestionOption, QuestionType, Response, utcnow
from .services import generate_slug
from .validation import clean_answer

T = QuestionType

FORMS = [
    {
        "title": "Customer Feedback Survey",
        "status": FormStatus.published,
        "thank_you": {"title": "Thanks for your feedback!", "description": "We read every response."},
        "responses": 18,
        "partials": 4,
        "questions": [
            {"type": T.short_text, "title": "Hi there! What's your name?", "required": True},
            {"type": T.email, "title": "What's your email address?",
             "description": "We'll only use this to follow up on your feedback.", "required": True},
            {"type": T.multiple_choice, "title": "How did you hear about us?", "required": True,
             "options": ["Search engine", "Social media", "A friend or colleague", "Podcast", "Other"]},
            {"type": T.rating, "title": "How would you rate your overall experience?",
             "required": True, "properties": {"steps": 5}},
            {"type": T.yes_no, "title": "Would you recommend us to a friend?", "required": True},
            {"type": T.long_text, "title": "Anything else you'd like to tell us?",
             "description": "Optional, but we'd love to hear it."},
        ],
    },
    {
        "title": "Product Launch Waitlist",
        "status": FormStatus.published,
        "thank_you": {"title": "You're on the list 🎉", "description": "We'll email you when we launch."},
        "responses": 12,
        "partials": 2,
        "questions": [
            {"type": T.short_text, "title": "First things first, what's your name?", "required": True},
            {"type": T.email, "title": "Where should we send your invite?", "required": True},
            {"type": T.dropdown, "title": "What best describes your role?", "required": True,
             "options": ["Designer", "Engineer", "Product Manager", "Founder", "Marketer", "Student"]},
            {"type": T.number, "title": "How many people are on your team?",
             "properties": {"min": 1, "max": 100000}},
            {"type": T.multiple_choice, "title": "Which feature are you most excited about?",
             "required": True, "options": ["Templates", "Integrations", "Analytics", "Team workspaces"]},
            {"type": T.yes_no, "title": "Want product updates in your inbox?"},
        ],
    },
    {
        "title": "Job Application — Product Designer",
        "status": FormStatus.draft,
        "responses": 0,
        "partials": 0,
        "questions": [
            {"type": T.short_text, "title": "What's your full name?", "required": True},
            {"type": T.email, "title": "And your email?", "required": True},
            {"type": T.short_text, "title": "Link to your portfolio", "required": True},
        ],
    },
]

NAMES = ["Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Kabir", "Meera", "Arjun",
         "Isha", "Dev", "Nisha", "Karan", "Tara", "Rahul", "Zoya", "Aditya", "Riya", "Neel", "Kavya"]
COMMENTS = ["Loved how quick it was.", "The onboarding could be smoother.",
            "Great support team!", "Please add a dark mode.", "Pricing is a bit confusing."]


def _fake_value(rng: random.Random, question: Question, name: str):
    """A plausible raw answer, in the same shape the frontend would send."""
    t = question.type
    if not question.required and rng.random() < 0.25:
        return None  # sometimes skip optional questions
    if t == T.short_text:
        return name
    if t == T.email:
        return f"{name.lower()}{rng.randint(1, 99)}@example.com"
    if t == T.long_text:
        return rng.choice(COMMENTS)
    if t in (T.multiple_choice, T.dropdown):
        return rng.choice(question.options).id
    if t == T.rating:
        return rng.choices([1, 2, 3, 4, 5], weights=[1, 1, 3, 6, 5])[0]
    if t == T.yes_no:
        return rng.choices(["yes", "no"], weights=[4, 1])[0]
    if t == T.number:
        return rng.choice([1, 3, 5, 8, 12, 25, 60, 150])
    return None


def _build_form(db: Session, spec: dict) -> Form:
    form = Form(
        title=spec["title"],
        slug=generate_slug(db),
        status=spec["status"],
        thank_you=spec.get("thank_you", {}),
    )
    for position, q in enumerate(spec["questions"]):
        form.all_questions.append(
            Question(
                position=position,
                type=q["type"],
                title=q["title"],
                description=q.get("description"),
                required=q.get("required", False),
                properties=q.get("properties", {}),
                options=[QuestionOption(position=i, label=label)
                         for i, label in enumerate(q.get("options", []))],
            )
        )
    db.add(form)
    db.flush()  # assigns ids, needed for choice answers
    return form


def _add_responses(db: Session, rng: random.Random, form: Form, count: int, partials: int):
    now = utcnow()
    for i in range(count + partials):
        name = rng.choice(NAMES)
        started = now - timedelta(days=rng.randint(0, 13), minutes=rng.randint(0, 1440))
        finished = i < count
        response = Response(
            form_id=form.id,
            started_at=started,
            submitted_at=started + timedelta(minutes=rng.randint(1, 6)) if finished else None,
        )
        # Unfinished responses answered only the first couple of questions.
        questions = form.questions if finished else form.questions[: rng.randint(1, 2)]
        for question in questions:
            result = clean_answer(question, _fake_value(rng, question, name))
            if result is not None:
                response.answers.append(Answer(
                    question_id=question.id, option_id=result.option_id,
                    value_text=result.value_text, value_number=result.value_number,
                ))
        db.add(response)


def seed(db: Session) -> None:
    rng = random.Random(42)  # deterministic, so the demo looks the same every time
    for spec in FORMS:
        form = _build_form(db, spec)
        db.refresh(form)
        _add_responses(db, rng, form, spec["responses"], spec["partials"])
    db.commit()


def seed_if_empty(db: Session) -> bool:
    if db.scalar(select(func.count(Form.id))):
        return False
    seed(db)
    return True


if __name__ == "__main__":
    from .database import Base, SessionLocal, engine

    if "--reset" in sys.argv:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        print("Seeded." if seed_if_empty(session) else "Database already has data; use --reset.")
