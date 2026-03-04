from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Doctor
from ..schemas import DoctorOut

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[DoctorOut])
def list_doctors(
    specialty: str | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Doctor)
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    if q:
        q_text = f"%{q}%"
        query = query.filter((Doctor.name.ilike(q_text)) | (Doctor.specialty.ilike(q_text)))
    return query.order_by(Doctor.name.asc()).all()
