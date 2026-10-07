"""Creator-side results: responses list, single response, summary, CSV export."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response as HTTPResponse
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..models import Response
from ..schemas import FormSummary, ResponseOut

router = APIRouter(prefix="/api/forms/{form_id}", tags=["results"])


@router.get("/responses", response_model=list[ResponseOut])
def list_responses(form_id: int, db: Session = Depends(get_db)):
    form = services.get_form_or_404(db, form_id)
    return [services.to_response_out(r) for r in services.submitted_responses(db, form)]


@router.get("/responses/{response_id}", response_model=ResponseOut)
def get_response(form_id: int, response_id: int, db: Session = Depends(get_db)):
    response = db.get(Response, response_id)
    if response is None or response.form_id != form_id or response.submitted_at is None:
        raise HTTPException(status_code=404, detail="Response not found")
    return services.to_response_out(response)


@router.get("/summary", response_model=FormSummary)
def get_summary(form_id: int, db: Session = Depends(get_db)):
    return services.build_summary(db, services.get_form_or_404(db, form_id))


@router.get("/export.csv")
def export_responses(form_id: int, db: Session = Depends(get_db)):
    form = services.get_form_or_404(db, form_id)
    return HTTPResponse(
        content=services.export_csv(db, form),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{form.slug}-responses.csv"'},
    )
