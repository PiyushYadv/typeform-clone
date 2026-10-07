"""Creator-side form management and builder endpoints."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..models import Form, FormStatus
from ..schemas import FormCreate, FormListItem, FormOut, FormUpdate, QuestionsSyncIn

router = APIRouter(prefix="/api/forms", tags=["forms"])


def _saved(db: Session, form: Form) -> FormOut:
    """Commit, reload relationships, and return the fresh form."""
    db.commit()
    db.refresh(form)
    return FormOut.model_validate(form)


@router.get("", response_model=list[FormListItem])
def list_forms(db: Session = Depends(get_db)):
    return services.list_forms(db)


@router.post("", response_model=FormOut, status_code=status.HTTP_201_CREATED)
def create_form(payload: FormCreate, db: Session = Depends(get_db)):
    form = Form(title=payload.title, slug=services.generate_slug(db))
    db.add(form)
    return _saved(db, form)


@router.get("/{form_id}", response_model=FormOut)
def get_form(form_id: int, db: Session = Depends(get_db)):
    return services.get_form_or_404(db, form_id)


@router.patch("/{form_id}", response_model=FormOut)
def update_form(form_id: int, payload: FormUpdate, db: Session = Depends(get_db)):
    form = services.get_form_or_404(db, form_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(form, field, value)
    return _saved(db, form)


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    db.delete(services.get_form_or_404(db, form_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{form_id}/duplicate", response_model=FormOut, status_code=status.HTTP_201_CREATED)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    copy = services.duplicate_form(db, services.get_form_or_404(db, form_id))
    return _saved(db, copy)


@router.post("/{form_id}/publish", response_model=FormOut)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    form = services.get_form_or_404(db, form_id)
    services.publish_form(form)
    return _saved(db, form)


@router.post("/{form_id}/unpublish", response_model=FormOut)
def unpublish_form(form_id: int, db: Session = Depends(get_db)):
    form = services.get_form_or_404(db, form_id)
    form.status = FormStatus.draft
    return _saved(db, form)


@router.put("/{form_id}/questions", response_model=FormOut)
def save_questions(form_id: int, payload: QuestionsSyncIn, db: Session = Depends(get_db)):
    """Bulk-save the builder: add, edit, reorder and delete in one request."""
    form = services.get_form_or_404(db, form_id)
    services.sync_questions(db, form, payload.questions)
    return _saved(db, form)
