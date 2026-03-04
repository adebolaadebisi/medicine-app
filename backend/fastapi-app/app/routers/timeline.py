import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import (
    Appointment,
    Doctor,
    FoodCheck,
    MealPlan,
    MedicationAdherenceLog,
    MedicationReminder,
    User,
    VitalEntry,
)
from ..schemas import TimelineItemOut

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("", response_model=list[TimelineItemOut])
def get_timeline(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fetch_limit = min(limit * 3, 200)
    events: list[TimelineItemOut] = []

    food_checks = (
        db.query(FoodCheck)
        .filter(FoodCheck.user_id == current_user.id)
        .order_by(FoodCheck.created_at.desc())
        .limit(fetch_limit)
        .all()
    )
    for row in food_checks:
        events.append(
            TimelineItemOut(
                id=f"food-check-{row.id}",
                event_type="food_check",
                title=f"Food check: {row.name}",
                description=row.message,
                occurred_at=row.created_at,
                meta={
                    "status": row.status,
                    "expiry": row.expiry,
                    "days_until_expiry": row.days_until_expiry,
                },
            )
        )

    meal_plans = (
        db.query(MealPlan)
        .filter(MealPlan.user_id == current_user.id)
        .order_by(MealPlan.created_at.desc())
        .limit(fetch_limit)
        .all()
    )
    for row in meal_plans:
        plan_data = {}
        try:
            plan_data = json.loads(row.data)
        except (TypeError, json.JSONDecodeError):
            plan_data = {}
        summary = f"{row.plan_type} plan for {row.condition}"
        if row.goal:
            summary = f"{summary} (goal: {row.goal})"
        events.append(
            TimelineItemOut(
                id=f"meal-plan-{row.id}",
                event_type="meal_plan",
                title="Meal plan created",
                description=summary,
                occurred_at=row.created_at,
                meta={
                    "plan_type": row.plan_type,
                    "condition": row.condition,
                    "goal": row.goal,
                    "activity": row.activity,
                    "keys": list(plan_data.keys()),
                },
            )
        )

    reminders = (
        db.query(MedicationReminder)
        .filter(MedicationReminder.user_id == current_user.id)
        .order_by(MedicationReminder.created_at.desc())
        .limit(fetch_limit)
        .all()
    )
    reminder_meta = {row.id: row for row in reminders}
    for row in reminders:
        events.append(
            TimelineItemOut(
                id=f"medication-reminder-{row.id}",
                event_type="medication_reminder",
                title=f"Medication reminder: {row.medicine_name}",
                description=f"{row.dosage} at {row.reminder_time}",
                occurred_at=row.created_at,
                meta={
                    "is_active": row.is_active,
                    "start_date": row.start_date,
                    "end_date": row.end_date,
                },
            )
        )

    adherence_logs = (
        db.query(MedicationAdherenceLog)
        .filter(MedicationAdherenceLog.user_id == current_user.id)
        .order_by(MedicationAdherenceLog.logged_at.desc())
        .limit(fetch_limit)
        .all()
    )
    for row in adherence_logs:
        reminder = reminder_meta.get(row.reminder_id)
        medicine_name = reminder.medicine_name if reminder else "Medication"
        events.append(
            TimelineItemOut(
                id=f"medication-log-{row.id}",
                event_type="medication_adherence",
                title=f"{medicine_name}: {row.status}",
                description=f"Logged for {row.log_date}",
                occurred_at=row.logged_at,
                meta={"status": row.status, "log_date": row.log_date},
            )
        )

    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
        .limit(fetch_limit)
        .all()
    )
    doctor_ids = [row.doctor_id for row in appointments]
    doctors = (
        db.query(Doctor).filter(Doctor.id.in_(doctor_ids)).all()
        if doctor_ids
        else []
    )
    doctors_by_id = {row.id: row for row in doctors}
    for row in appointments:
        doctor = doctors_by_id.get(row.doctor_id)
        doctor_name = doctor.name if doctor else "Doctor"
        events.append(
            TimelineItemOut(
                id=f"appointment-{row.id}",
                event_type="appointment",
                title=f"Appointment {row.status}: {doctor_name}",
                description=f"{row.mode} consultation at {row.appointment_time.isoformat()}",
                occurred_at=row.created_at,
                meta={
                    "status": row.status,
                    "mode": row.mode,
                    "appointment_time": row.appointment_time.isoformat(),
                },
            )
        )

    vitals = (
        db.query(VitalEntry)
        .filter(VitalEntry.user_id == current_user.id)
        .order_by(VitalEntry.measured_at.desc())
        .limit(fetch_limit)
        .all()
    )
    for row in vitals:
        pieces: list[str] = []
        if row.systolic_bp is not None and row.diastolic_bp is not None:
            pieces.append(f"BP {row.systolic_bp}/{row.diastolic_bp}")
        if row.glucose_mg_dl is not None:
            pieces.append(f"Glucose {row.glucose_mg_dl} mg/dL")
        if row.weight_kg is not None:
            pieces.append(f"Weight {row.weight_kg} kg")
        if row.heart_rate_bpm is not None:
            pieces.append(f"Heart rate {row.heart_rate_bpm} bpm")
        events.append(
            TimelineItemOut(
                id=f"vital-{row.id}",
                event_type="vital_entry",
                title="Vitals logged",
                description=", ".join(pieces) if pieces else "Vital reading recorded.",
                occurred_at=row.measured_at,
                meta={
                    "systolic_bp": row.systolic_bp,
                    "diastolic_bp": row.diastolic_bp,
                    "glucose_mg_dl": row.glucose_mg_dl,
                    "weight_kg": row.weight_kg,
                    "heart_rate_bpm": row.heart_rate_bpm,
                },
            )
        )

    events.sort(key=lambda item: item.occurred_at, reverse=True)
    return events[:limit]
