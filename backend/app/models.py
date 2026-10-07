"""Database schema.

    forms 1──* questions 1──* question_options
      │            │                 │
      1            1                 │ (nullable, SET NULL)
      *            *                 │
    responses 1──* answers ──────────┘

Key decisions:
- Questions are soft-deleted (deleted_at) so responses collected earlier
  never lose the question they answered.
- Answers keep a copy of the chosen option's label in value_text, so an
  answer still reads correctly even if the option is later removed.
- responses.submitted_at is NULL for started-but-unfinished responses,
  which gives completion-rate tracking for free.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class QuestionType(str, enum.Enum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"


# Question types whose answers point at a row in question_options.
CHOICE_TYPES = {QuestionType.multiple_choice, QuestionType.dropdown}


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    status: Mapped[FormStatus] = mapped_column(
        Enum(FormStatus, native_enum=False), default=FormStatus.draft
    )
    theme: Mapped[dict] = mapped_column(JSON, default=dict)
    thank_you: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    # Every question ever created, including soft-deleted ones. Owns the rows.
    all_questions: Mapped[list[Question]] = relationship(
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )
    # Read-only view of the live questions — what builders and respondents see.
    questions: Mapped[list[Question]] = relationship(
        primaryjoin="and_(Question.form_id == Form.id, Question.deleted_at.is_(None))",
        order_by="Question.position",
        viewonly=True,
    )
    responses: Mapped[list[Response]] = relationship(
        back_populates="form", cascade="all, delete-orphan", passive_deletes=True
    )


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (Index("ix_questions_form_position", "form_id", "position"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(default=0)
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType, native_enum=False))
    title: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    # Type-specific settings, e.g. {"steps": 5} for rating, {"min": 1} for number.
    properties: Mapped[dict] = mapped_column(JSON, default=dict)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    form: Mapped[Form] = relationship(back_populates="all_questions")
    options: Mapped[list[QuestionOption]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.position",
    )


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(default=0)
    label: Mapped[str] = mapped_column(String(255))

    question: Mapped[Question] = relationship(back_populates="options")


class Response(Base):
    __tablename__ = "responses"
    __table_args__ = (Index("ix_responses_form_submitted", "form_id", "submitted_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    form: Mapped[Form] = relationship(back_populates="responses")
    answers: Mapped[list[Answer]] = relationship(
        back_populates="response", cascade="all, delete-orphan", passive_deletes=True
    )


class Answer(Base):
    __tablename__ = "answers"
    # One answer per question per response.
    __table_args__ = (UniqueConstraint("response_id", "question_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    response_id: Mapped[int] = mapped_column(ForeignKey("responses.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True
    )
    option_id: Mapped[int | None] = mapped_column(
        ForeignKey("question_options.id", ondelete="SET NULL"), nullable=True
    )
    # Text-like answers (and choice labels, yes/no) live in value_text;
    # number and rating answers live in value_number so they can be averaged.
    value_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_number: Mapped[float | None] = mapped_column(Float, nullable=True)

    response: Mapped[Response] = relationship(back_populates="answers")
    question: Mapped[Question] = relationship()

    @property
    def value(self) -> str | float | None:
        return self.value_text if self.value_text is not None else self.value_number
