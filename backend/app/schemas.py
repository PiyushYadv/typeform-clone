"""Request and response shapes for the API (Pydantic v2)."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .models import FormStatus, QuestionType


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Builder input ----------

class OptionIn(BaseModel):
    id: int | None = None  # present = update existing option, absent = create new
    label: str = Field(min_length=1, max_length=255)


class QuestionIn(BaseModel):
    id: int | None = None  # present = update existing question, absent = create new
    type: QuestionType
    title: str = Field(default="", max_length=500)
    description: str | None = None
    required: bool = False
    properties: dict[str, Any] = Field(default_factory=dict)
    options: list[OptionIn] = Field(default_factory=list)


class QuestionsSyncIn(BaseModel):
    """The full ordered question list. List order becomes question order."""
    questions: list[QuestionIn]


class FormCreate(BaseModel):
    title: str = Field(default="My new form", min_length=1, max_length=255)


class FormUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    theme: dict[str, Any] | None = None
    thank_you: dict[str, Any] | None = None


# ---------- Builder / dashboard output ----------

class OptionOut(ORMModel):
    id: int
    position: int
    label: str


class QuestionOut(ORMModel):
    id: int
    position: int
    type: QuestionType
    title: str
    description: str | None
    required: bool
    properties: dict[str, Any]
    options: list[OptionOut]


class FormListItem(ORMModel):
    id: int
    title: str
    slug: str
    status: FormStatus
    response_count: int = 0
    question_count: int = 0
    created_at: datetime
    updated_at: datetime


class FormOut(ORMModel):
    id: int
    title: str
    slug: str
    status: FormStatus
    theme: dict[str, Any]
    thank_you: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut]


# ---------- Public respondent flow ----------

class PublicFormOut(ORMModel):
    title: str
    slug: str
    theme: dict[str, Any]
    thank_you: dict[str, Any]
    questions: list[QuestionOut]


class AnswerIn(BaseModel):
    question_id: int
    # Raw value from the client. Its meaning depends on question type:
    # text for text/email, number for number/rating, "yes"/"no" or bool for
    # yes_no, and the option id for multiple_choice/dropdown.
    value: Any = None


class SubmissionIn(BaseModel):
    answers: list[AnswerIn]
    started_at: datetime | None = None
    # From POST /start. When given, that started response is completed instead
    # of creating a new one, which is what makes completion rate accurate.
    response_id: int | None = None


class StartResult(BaseModel):
    response_id: int


class SubmissionResult(BaseModel):
    response_id: int


# ---------- Results ----------

class AnswerOut(BaseModel):
    question_id: int
    # Included so answers to since-deleted questions still read clearly.
    question_title: str
    value: str | float | None


class ResponseOut(BaseModel):
    id: int
    started_at: datetime
    submitted_at: datetime | None
    answers: list[AnswerOut]


class QuestionSummary(BaseModel):
    question_id: int
    title: str
    type: QuestionType
    answered: int
    skipped: int
    stats: dict[str, Any]


class FormSummary(BaseModel):
    total_responses: int
    total_started: int
    completion_rate: float  # 0–100
    questions: list[QuestionSummary]
