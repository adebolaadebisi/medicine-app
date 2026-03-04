from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_admin_user, get_current_user
from ..models import Appointment, Doctor, User
from ..notifications_service import create_notification
from ..schemas import (
    AdminAppointmentUpdateRequest,
    AppointmentCreate,
    AppointmentOut,
    AppointmentRescheduleRequest,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _to_out(row: Appointment, doctor: Doctor) -> AppointmentOut:
    return AppointmentOut(
        id=row.id,
        user_id=row.user_id,
        doctor_id=row.doctor_id,
        doctor_name=doctor.name,
        doctor_specialty=doctor.specialty,
        appointment_time=row.appointment_time,
        mode=row.mode,
        status=row.status,
        reason=row.reason,
        admin_notes=row.admin_notes,
        created_at=row.created_at,
    )


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if payload.appointment_time <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointment time must be in the future",
        )

    row = Appointment(
        user_id=current_user.id,
        doctor_id=doctor.id,
        appointment_time=payload.appointment_time,
        mode=payload.mode,
        status="pending",
        reason=payload.reason.strip() if payload.reason else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row, doctor)


@router.get("", response_model=list[AppointmentOut])
def list_my_appointments(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment).filter(Appointment.user_id == current_user.id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    rows = query.order_by(Appointment.appointment_time.asc()).limit(limit).all()

    doctor_ids = [row.doctor_id for row in rows]
    doctors = (
        db.query(Doctor).filter(Doctor.id.in_(doctor_ids)).all()
        if doctor_ids
        else []
    )
    doctors_by_id = {row.id: row for row in doctors}
    return [_to_out(row, doctors_by_id[row.doctor_id]) for row in rows if row.doctor_id in doctors_by_id]


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if row.status in {"completed", "cancelled", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel an appointment in {row.status} state",
        )
    row.status = "cancelled"
    db.commit()
    db.refresh(row)
    doctor = db.query(Doctor).filter(Doctor.id == row.doctor_id).first()
    return _to_out(row, doctor)


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appointment_id: int,
    payload: AppointmentRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if row.status in {"completed", "cancelled", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reschedule an appointment in {row.status} state",
        )
    if payload.appointment_time <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointment time must be in the future",
        )
    row.appointment_time = payload.appointment_time
    if payload.reason:
        row.reason = payload.reason.strip()
    row.status = "pending"
    db.commit()
    db.refresh(row)
    doctor = db.query(Doctor).filter(Doctor.id == row.doctor_id).first()
    return _to_out(row, doctor)


@router.get("/admin", response_model=list[AppointmentOut])
def list_all_appointments_for_admin(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=300),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    rows = query.order_by(Appointment.created_at.desc()).limit(limit).all()
    doctor_ids = [row.doctor_id for row in rows]
    doctors = (
        db.query(Doctor).filter(Doctor.id.in_(doctor_ids)).all()
        if doctor_ids
        else []
    )
    doctors_by_id = {row.id: row for row in doctors}
    return [_to_out(row, doctors_by_id[row.doctor_id]) for row in rows if row.doctor_id in doctors_by_id]


@router.patch("/admin/{appointment_id}", response_model=AppointmentOut)
def update_appointment_status_for_admin(
    appointment_id: int,
    payload: AdminAppointmentUpdateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    row = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    row.status = payload.status
    row.admin_notes = payload.admin_notes.strip() if payload.admin_notes else None
    create_notification(
        db,
        user_id=row.user_id,
        kind="appointment_status",
        title="Appointment status updated",
        message=f"Your appointment #{row.id} is now {row.status}.",
        reference_key=f"appt-status-{row.id}-{row.status}-{datetime.now(timezone.utc).isoformat()}",
    )
    db.commit()
    db.refresh(row)
    doctor = db.query(Doctor).filter(Doctor.id == row.doctor_id).first()
    return _to_out(row, doctor)
