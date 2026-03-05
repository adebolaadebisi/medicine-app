import json
import secrets
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_admin_user
from ..models import (
    Appointment,
    CaregiverLink,
    CaregiverProfile,
    Doctor,
    FoodCheck,
    MealPlan,
    MedicationReminder,
    User,
)
from ..schemas import AdminPasswordResetRequest, AdminPasswordResetResponse
from ..security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("/overview")
def admin_overview(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_doctors = db.query(func.count(Doctor.id)).scalar() or 0
    total_food_checks = db.query(func.count(FoodCheck.id)).scalar() or 0
    total_meal_plans = db.query(func.count(MealPlan.id)).scalar() or 0
    total_medication_reminders = db.query(func.count(MedicationReminder.id)).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0
    total_caregivers = db.query(func.count(CaregiverProfile.id)).scalar() or 0
    total_patients = max(total_users - total_caregivers, 0)
    total_active_caregiver_links = (
        db.query(func.count(CaregiverLink.id))
        .filter(CaregiverLink.status == "active")
        .scalar()
        or 0
    )
    total_pending_caregiver_links = (
        db.query(func.count(CaregiverLink.id))
        .filter(CaregiverLink.status == "pending")
        .scalar()
        or 0
    )

    caregiver_user_ids = db.query(CaregiverProfile.user_id)

    recent_patients = (
        db.query(User)
        .filter(~User.id.in_(caregiver_user_ids))
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )
    recent_caregivers = (
        db.query(User)
        .filter(User.id.in_(caregiver_user_ids))
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )
    recent_food_checks = (
        db.query(FoodCheck)
        .order_by(FoodCheck.created_at.desc())
        .limit(5)
        .all()
    )
    recent_meal_plans = (
        db.query(MealPlan)
        .order_by(MealPlan.created_at.desc())
        .limit(5)
        .all()
    )
    recent_appointments = (
        db.query(Appointment)
        .order_by(Appointment.created_at.desc())
        .limit(5)
        .all()
    )
    recent_caregiver_links = (
        db.query(CaregiverLink)
        .order_by(CaregiverLink.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "stats": {
            "total_users": total_users,
            "total_doctors": total_doctors,
            "total_food_checks": total_food_checks,
            "total_meal_plans": total_meal_plans,
            "total_medication_reminders": total_medication_reminders,
            "total_appointments": total_appointments,
            "total_caregivers": total_caregivers,
            "total_patients": total_patients,
            "total_active_caregiver_links": total_active_caregiver_links,
            "total_pending_caregiver_links": total_pending_caregiver_links,
        },
        "recent_patients": [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at,
            }
            for user in recent_patients
        ],
        "recent_caregivers": [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at,
            }
            for user in recent_caregivers
        ],
        "recent_food_checks": [
            {
                "id": row.id,
                "user_id": row.user_id,
                "name": row.name,
                "status": row.status,
                "expiry": row.expiry,
                "created_at": row.created_at,
            }
            for row in recent_food_checks
        ],
        "recent_meal_plans": [
            {
                "id": row.id,
                "user_id": row.user_id,
                "plan_type": row.plan_type,
                "condition": row.condition,
                "goal": row.goal,
                "activity": row.activity,
                "data": json.loads(row.data),
                "created_at": row.created_at,
            }
            for row in recent_meal_plans
        ],
        "recent_appointments": [
            {
                "id": row.id,
                "user_id": row.user_id,
                "doctor_id": row.doctor_id,
                "appointment_time": row.appointment_time,
                "mode": row.mode,
                "status": row.status,
                "created_at": row.created_at,
            }
            for row in recent_appointments
        ],
        "recent_caregiver_links": [
            {
                "id": row.id,
                "patient_email": row.patient_user.email,
                "caregiver_email": row.caregiver_user.email,
                "status": row.status,
                "created_at": row.created_at,
                "accepted_at": row.accepted_at,
            }
            for row in recent_caregiver_links
        ],
    }


@router.post("/users/reset-password", response_model=AdminPasswordResetResponse)
def reset_user_password(
    payload: AdminPasswordResetRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    next_password = payload.new_password or generate_temporary_password()
    user.hashed_password = hash_password(next_password)
    db.commit()

    return AdminPasswordResetResponse(
        email=user.email,
        temporary_password=next_password,
        reset_at=datetime.now(timezone.utc),
    )
