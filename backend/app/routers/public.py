"""Public respondent endpoints. No authentication: anyone with the link can fill."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..schemas import PublicFormOut, StartResult, SubmissionIn, SubmissionResult

router = APIRouter(prefix="/api/public/forms", tags=["public"])


@router.get("/{slug}", response_model=PublicFormOut)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    return services.get_published_form_or_404(db, slug)


@router.post("/{slug}/start", response_model=StartResult, status_code=status.HTTP_201_CREATED)
def start(slug: str, db: Session = Depends(get_db)):
    """Called when a respondent presses Start. Lets us measure drop-off."""
    response = services.start_response(db, services.get_published_form_or_404(db, slug))
    db.commit()
    return StartResult(response_id=response.id)


@router.post("/{slug}/responses", response_model=SubmissionResult,
             status_code=status.HTTP_201_CREATED)
def submit(slug: str, payload: SubmissionIn, db: Session = Depends(get_db)):
    form = services.get_published_form_or_404(db, slug)
    response = services.submit_response(db, form, payload)
    db.commit()
    return SubmissionResult(response_id=response.id)
