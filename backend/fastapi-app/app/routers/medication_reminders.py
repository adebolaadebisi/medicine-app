from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import MedicationAdherenceLog, MedicationReminder, User
from ..schemas import (
    AdherenceTrendOut,
    AdherenceTrendPoint,
    DailyAdherenceItem,
    DailyAdherenceSummary,
    MedicationAdherenceCreate,
    MedicationAdherenceOut,
    MedicationReminderCreate,
    MedicationReminderOut,
    MedicationReminderUpdate,
)

router = APIRouter(prefix="/medication-reminders", tags=["medication-reminders"])


def _normalize_days(days: list[int]) -> list[int]:
    unique = sorted(set(days))
    if any(day < 0 or day > 6 for day in unique):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="days_of_week must contain values from 0 (Monday) to 6 (Sunday)",
        )
    return unique


def _serialize_days(days: list[int]) -> str:
    return ",".join(str(day) for day in _normalize_days(days))


def _parse_days(raw: str) -> list[int]:
    if not raw:
        return []
    return [int(value) for value in raw.split(",") if value != ""]


def _to_out(row: MedicationReminder) -> MedicationReminderOut:
    return MedicationReminderOut(
        id=row.id,
        user_id=row.user_id,
        medicine_name=row.medicine_name,
        dosage=row.dosage,
        reminder_time=row.reminder_time,
        days_of_week=_parse_days(row.days_of_week),
        instructions=row.instructions,
        start_date=date.fromisoformat(row.start_date),
        end_date=date.fromisoformat(row.end_date) if row.end_date else None,
        is_active=row.is_active,
        created_at=row.created_at,
    )


def _matches_date(row: MedicationReminder, target_date: date) -> bool:
    if not row.is_active:
        return False
    if target_date.weekday() not in _parse_days(row.days_of_week):
        return False
    start = date.fromisoformat(row.start_date)
    if target_date < start:
        return False
    if row.end_date:
        end = date.fromisoformat(row.end_date)
        if target_date > end:
            return False
    return True


def _build_daily_summary(
    db: Session,
    user_id: int,
    target_date: date,
) -> DailyAdherenceSummary:
    reminders = db.query(MedicationReminder).filter(MedicationReminder.user_id == user_id).all()
    due_reminders = [row for row in reminders if _matches_date(row, target_date)]

    logs = (
        db.query(MedicationAdherenceLog)
        .filter(
            MedicationAdherenceLog.user_id == user_id,
            MedicationAdherenceLog.log_date == target_date.isoformat(),
        )
        .all()
    )
    logs_by_reminder = {row.reminder_id: row for row in logs}

    items: list[DailyAdherenceItem] = []
    taken = 0
    skipped = 0
    for reminder in due_reminders:
        log = logs_by_reminder.get(reminder.id)
        if log and log.status == "taken":
            taken += 1
        elif log and log.status == "skipped":
            skipped += 1
        items.append(
            DailyAdherenceItem(
                reminder_id=reminder.id,
                medicine_name=reminder.medicine_name,
                dosage=reminder.dosage,
                reminder_time=reminder.reminder_time,
                status=log.status if log else None,
                log_id=log.id if log else None,
            )
        )

    total_due = len(due_reminders)
    pending = max(total_due - (taken + skipped), 0)
    adherence_rate = round((taken / total_due) * 100, 2) if total_due else 0.0

    return DailyAdherenceSummary(
        date=target_date,
        total_due=total_due,
        taken=taken,
        skipped=skipped,
        pending=pending,
        adherence_rate=adherence_rate,
        items=items,
    )


@router.post("", response_model=MedicationReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: MedicationReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.end_date and payload.end_date < payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date cannot be earlier than start_date",
        )
    row = MedicationReminder(
        user_id=current_user.id,
        medicine_name=payload.medicine_name.strip(),
        dosage=payload.dosage.strip(),
        reminder_time=payload.reminder_time,
        days_of_week=_serialize_days(payload.days_of_week),
        instructions=payload.instructions.strip() if payload.instructions else None,
        start_date=payload.start_date.isoformat(),
        end_date=payload.end_date.isoformat() if payload.end_date else None,
        is_active=payload.is_active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.get("", response_model=list[MedicationReminderOut])
def list_reminders(
    only_active: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MedicationReminder).filter(MedicationReminder.user_id == current_user.id)
    if only_active:
        query = query.filter(MedicationReminder.is_active.is_(True))
    rows = query.order_by(MedicationReminder.reminder_time.asc()).all()
    return [_to_out(row) for row in rows]


@router.patch("/{reminder_id}", response_model=MedicationReminderOut)
def update_reminder(
    reminder_id: int,
    payload: MedicationReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(MedicationReminder)
        .filter(MedicationReminder.id == reminder_id, MedicationReminder.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    updates = payload.model_dump(exclude_unset=True)
    if "end_date" in updates and updates["end_date"]:
        start_date = updates.get("start_date", date.fromisoformat(row.start_date))
        if updates["end_date"] < start_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="end_date cannot be earlier than start_date",
            )

    if "medicine_name" in updates and updates["medicine_name"] is not None:
        row.medicine_name = updates["medicine_name"].strip()
    if "dosage" in updates and updates["dosage"] is not None:
        row.dosage = updates["dosage"].strip()
    if "reminder_time" in updates and updates["reminder_time"] is not None:
        row.reminder_time = updates["reminder_time"]
    if "days_of_week" in updates and updates["days_of_week"] is not None:
        row.days_of_week = _serialize_days(updates["days_of_week"])
    if "instructions" in updates:
        row.instructions = updates["instructions"].strip() if updates["instructions"] else None
    if "start_date" in updates and updates["start_date"] is not None:
        row.start_date = updates["start_date"].isoformat()
    if "end_date" in updates:
        row.end_date = updates["end_date"].isoformat() if updates["end_date"] else None
    if "is_active" in updates and updates["is_active"] is not None:
        row.is_active = updates["is_active"]

    db.commit()
    db.refresh(row)
    return _to_out(row)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(MedicationReminder)
        .filter(MedicationReminder.id == reminder_id, MedicationReminder.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/adherence", response_model=DailyAdherenceSummary)
def get_daily_adherence(
    log_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = log_date or date.today()
    return _build_daily_summary(db=db, user_id=current_user.id, target_date=target_date)


@router.get("/adherence/trend", response_model=AdherenceTrendOut)
def get_adherence_trend(
    days: int = Query(default=7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    points: list[AdherenceTrendPoint] = []

    for offset in range(days):
        target = start_date + timedelta(days=offset)
        summary = _build_daily_summary(db=db, user_id=current_user.id, target_date=target)
        points.append(
            AdherenceTrendPoint(
                date=summary.date,
                total_due=summary.total_due,
                taken=summary.taken,
                skipped=summary.skipped,
                pending=summary.pending,
                adherence_rate=summary.adherence_rate,
            )
        )

    return AdherenceTrendOut(days=days, points=points)


@router.post("/{reminder_id}/adherence", response_model=MedicationAdherenceOut)
def upsert_adherence(
    reminder_id: int,
    payload: MedicationAdherenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = (
        db.query(MedicationReminder)
        .filter(MedicationReminder.id == reminder_id, MedicationReminder.user_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    target_date = payload.log_date or date.today()
    row = (
        db.query(MedicationAdherenceLog)
        .filter(
            MedicationAdherenceLog.reminder_id == reminder_id,
            MedicationAdherenceLog.user_id == current_user.id,
            MedicationAdherenceLog.log_date == target_date.isoformat(),
        )
        .first()
    )
    if row:
        row.status = payload.status
    else:
        row = MedicationAdherenceLog(
            user_id=current_user.id,
            reminder_id=reminder_id,
            log_date=target_date.isoformat(),
            status=payload.status,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return MedicationAdherenceOut(
        id=row.id,
        user_id=row.user_id,
        reminder_id=row.reminder_id,
        log_date=date.fromisoformat(row.log_date),
        status=row.status,
        logged_at=row.logged_at,
    )
