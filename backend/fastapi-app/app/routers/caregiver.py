from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..email_service import send_caregiver_invite_email
from ..notifications_service import create_notification
from ..config import ADMIN_EMAILS
from ..models import Appointment, CaregiverLink, CaregiverProfile, User, VitalEntry
from ..schemas import (
    CaregiverInviteRequest,
    CaregiverLinkOut,
    CaregiverPatientOverviewOut,
)
from .vitals import evaluate_flags

router = APIRouter(prefix="/caregiver-links", tags=["caregiver"])


def _to_link_out(row: CaregiverLink) -> CaregiverLinkOut:
    return CaregiverLinkOut(
        id=row.id,
        patient_user_id=row.patient_user_id,
        caregiver_user_id=row.caregiver_user_id,
        patient_email=row.patient_user.email,
        caregiver_email=row.caregiver_user.email,
        status=row.status,
        created_at=row.created_at,
        accepted_at=row.accepted_at,
    )


@router.post("/invite", response_model=CaregiverLinkOut, status_code=status.HTTP_201_CREATED)
def invite_caregiver(
    payload: CaregiverInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    caregiver_email = payload.caregiver_email.strip().lower()
    if caregiver_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot invite yourself as caregiver",
        )

    caregiver_user = db.query(User).filter(User.email == caregiver_email).first()
    if not caregiver_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caregiver account not found. Ask them to register first.",
        )
    caregiver_profile = (
        db.query(CaregiverProfile)
        .filter(CaregiverProfile.user_id == caregiver_user.id)
        .first()
    )
    if not caregiver_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user is not registered as a caregiver yet.",
        )

    existing = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.patient_user_id == current_user.id,
            CaregiverLink.caregiver_user_id == caregiver_user.id,
        )
        .first()
    )
    if existing and existing.status in {"pending", "active"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Caregiver link already {existing.status}",
        )
    if existing and existing.status == "revoked":
        existing.status = "pending"
        existing.accepted_at = None
        db.commit()
        db.refresh(existing)
        create_notification(
            db,
            user_id=caregiver_user.id,
            kind="caregiver_invite",
            title="New caregiver invite",
            message=(
                f"{current_user.email} invited you as caregiver. "
                "Open Caregiver Hub and click Accept."
            ),
            reference_key=f"caregiver-invite-{existing.id}-{existing.created_at.isoformat()}",
        )
        db.commit()
        send_caregiver_invite_email(
            patient_email=current_user.email,
            caregiver_email=caregiver_user.email,
        )
        return _to_link_out(existing)

    row = CaregiverLink(
        patient_user_id=current_user.id,
        caregiver_user_id=caregiver_user.id,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    create_notification(
        db,
        user_id=caregiver_user.id,
        kind="caregiver_invite",
        title="New caregiver invite",
        message=(
            f"{current_user.email} invited you as caregiver. "
            "Open Caregiver Hub and click Accept."
        ),
        reference_key=f"caregiver-invite-{row.id}-{row.created_at.isoformat()}",
    )
    db.commit()
    send_caregiver_invite_email(
        patient_email=current_user.email,
        caregiver_email=caregiver_user.email,
    )
    return _to_link_out(row)


@router.get("/mine", response_model=list[CaregiverLinkOut])
def list_my_caregiver_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(CaregiverLink)
        .filter(CaregiverLink.patient_user_id == current_user.id)
        .order_by(CaregiverLink.created_at.desc())
        .all()
    )
    return [_to_link_out(row) for row in rows]


@router.get("/assigned", response_model=list[CaregiverLinkOut])
def list_assigned_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(CaregiverLink)
        .filter(CaregiverLink.caregiver_user_id == current_user.id)
        .order_by(CaregiverLink.created_at.desc())
        .all()
    )
    return [_to_link_out(row) for row in rows]


@router.patch("/{link_id}/accept", response_model=CaregiverLinkOut)
def accept_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.id == link_id,
            CaregiverLink.caregiver_user_id == current_user.id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    row.status = "active"
    row.accepted_at = datetime.now(timezone.utc)
    create_notification(
        db,
        user_id=row.patient_user_id,
        kind="caregiver_link_accepted",
        title="Caregiver accepted",
        message=f"{current_user.email} accepted your caregiver invite.",
        reference_key=f"caregiver-accepted-{row.id}-{row.accepted_at.isoformat()}",
    )
    admin_users = []
    if ADMIN_EMAILS:
        admin_users = db.query(User).filter(User.email.in_(ADMIN_EMAILS)).all()
    for admin_user in admin_users:
        create_notification(
            db,
            user_id=admin_user.id,
            kind="admin_caregiver_link_accepted",
            title="Caregiver link accepted",
            message=(
                f"Caregiver {current_user.email} accepted patient "
                f"{row.patient_user.email}'s invite."
            ),
            reference_key=(
                f"admin-{admin_user.id}-caregiver-accepted-{row.id}-"
                f"{row.accepted_at.isoformat()}"
            ),
        )
    db.commit()
    db.refresh(row)
    return _to_link_out(row)


@router.patch("/{link_id}/revoke", response_model=CaregiverLinkOut)
def revoke_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(CaregiverLink).filter(CaregiverLink.id == link_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    if current_user.id not in {row.patient_user_id, row.caregiver_user_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    row.status = "revoked"
    db.commit()
    db.refresh(row)
    return _to_link_out(row)


@router.get("/patient/{patient_id}/overview", response_model=CaregiverPatientOverviewOut)
def caregiver_patient_overview(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.patient_user_id == patient_id,
            CaregiverLink.caregiver_user_id == current_user.id,
            CaregiverLink.status == "active",
        )
        .first()
    )
    if not link:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No active caregiver access")

    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    recent_vitals = (
        db.query(VitalEntry)
        .filter(VitalEntry.user_id == patient_id)
        .order_by(VitalEntry.measured_at.desc())
        .limit(15)
        .all()
    )
    recent_flags = []
    for row in recent_vitals:
        recent_flags.extend(evaluate_flags(row))
    recent_flags.sort(key=lambda item: item.measured_at, reverse=True)

    upcoming = (
        db.query(Appointment)
        .filter(
            Appointment.user_id == patient_id,
            Appointment.appointment_time >= datetime.now(timezone.utc) - timedelta(hours=1),
            Appointment.status.in_(["pending", "confirmed"]),
        )
        .order_by(Appointment.appointment_time.asc())
        .limit(10)
        .all()
    )

    doctor_ids = [row.doctor_id for row in upcoming]
    doctors = {}
    if doctor_ids:
        from ..models import Doctor

        doctors = {row.id: row for row in db.query(Doctor).filter(Doctor.id.in_(doctor_ids)).all()}

    from ..schemas import AppointmentOut

    appointment_out = [
        AppointmentOut(
            id=row.id,
            user_id=row.user_id,
            doctor_id=row.doctor_id,
            doctor_name=doctors[row.doctor_id].name if row.doctor_id in doctors else "Doctor",
            doctor_specialty=doctors[row.doctor_id].specialty if row.doctor_id in doctors else "Unknown",
            appointment_time=row.appointment_time,
            mode=row.mode,
            status=row.status,
            reason=row.reason,
            admin_notes=row.admin_notes,
            created_at=row.created_at,
        )
        for row in upcoming
    ]

    return CaregiverPatientOverviewOut(
        patient_id=patient.id,
        patient_email=patient.email,
        patient_name=patient.full_name,
        recent_vitals=recent_vitals,
        recent_vital_flags=recent_flags[:20],
        upcoming_appointments=appointment_out,
    )
