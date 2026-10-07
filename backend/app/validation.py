"""Server-side answer validation.

The frontend validates too, but the server is the source of truth: a
published form is public, so anyone can POST to it directly.

Error messages copy Typeform's tone so the client can show them as-is.
"""

import math
import re
from dataclasses import dataclass
from typing import Any

from .models import CHOICE_TYPES, Question, QuestionType

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SHORT_TEXT_LIMIT = 255
LONG_TEXT_LIMIT = 10_000
DEFAULT_RATING_STEPS = 5


class AnswerError(ValueError):
    """Raised when an answer is invalid. The message is shown to the respondent."""


@dataclass
class CleanAnswer:
    value_text: str | None = None
    value_number: float | None = None
    option_id: int | None = None


def _is_blank(raw: Any) -> bool:
    return raw is None or (isinstance(raw, str) and not raw.strip())


def _as_int(raw: Any) -> int | None:
    """Accept 3, 3.0 or "3" as an integer; reject booleans and fractions."""
    if isinstance(raw, bool):
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, float) and raw.is_integer():
        return int(raw)
    if isinstance(raw, str) and raw.strip().lstrip("-").isdigit():
        return int(raw.strip())
    return None


def clean_answer(question: Question, raw: Any) -> CleanAnswer | None:
    """Validate one raw answer. Returns None for a skipped optional question."""
    if _is_blank(raw):
        if question.required:
            raise AnswerError("Please fill this in")
        return None

    qtype = question.type
    props = question.properties or {}

    if qtype in (QuestionType.short_text, QuestionType.long_text):
        if not isinstance(raw, str):
            raise AnswerError("Please enter some text")
        limit = SHORT_TEXT_LIMIT if qtype == QuestionType.short_text else LONG_TEXT_LIMIT
        text = raw.strip()
        if len(text) > limit:
            raise AnswerError(f"Please keep it under {limit} characters")
        return CleanAnswer(value_text=text)

    if qtype == QuestionType.email:
        if not isinstance(raw, str) or not EMAIL_RE.match(raw.strip()):
            raise AnswerError("Hmm... that email doesn't look right")
        return CleanAnswer(value_text=raw.strip())

    if qtype == QuestionType.number:
        if isinstance(raw, bool):
            raise AnswerError("Numbers only please")
        try:
            number = float(raw)
        except (TypeError, ValueError):
            raise AnswerError("Numbers only please") from None
        if not math.isfinite(number):
            raise AnswerError("Numbers only please")
        if "min" in props and number < props["min"]:
            raise AnswerError(f"Please enter a number of {props['min']} or more")
        if "max" in props and number > props["max"]:
            raise AnswerError(f"Please enter a number of {props['max']} or less")
        return CleanAnswer(value_number=number)

    if qtype == QuestionType.yes_no:
        if isinstance(raw, bool):
            return CleanAnswer(value_text="yes" if raw else "no")
        if isinstance(raw, str) and raw.strip().lower() in ("yes", "no"):
            return CleanAnswer(value_text=raw.strip().lower())
        raise AnswerError("Oops! Please make a selection")

    if qtype == QuestionType.rating:
        steps = int(props.get("steps", DEFAULT_RATING_STEPS))
        rating = _as_int(raw)
        if rating is None or not 1 <= rating <= steps:
            raise AnswerError("Oops! Please make a selection")
        return CleanAnswer(value_number=float(rating))

    if qtype in CHOICE_TYPES:
        option_id = _as_int(raw)
        option = next((o for o in question.options if o.id == option_id), None)
        if option is None:
            raise AnswerError("Oops! Please make a selection")
        # Snapshot the label so the answer stays readable if the option is deleted later.
        return CleanAnswer(value_text=option.label, option_id=option.id)

    raise AnswerError("Unsupported question type")
