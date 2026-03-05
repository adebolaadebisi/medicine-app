from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .models import (
    Appointment,
    CaregiverLink,
    MedicationAdherenceLog,
    MedicationReminder,
    Notification,
    User,
)


def create_notification(
    db: Session,
    *,
    user_id: int,
    kind: str,
    title: str,
    message: str,
    reference_key: str | None = None,
) -> Notification:
    if reference_key:
        existing = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.reference_key == reference_key)
            .first()
        )
        if existing:
            return existing

    row = Notification(
        user_id=user_id,
        kind=kind,
        title=title,
        message=message,
        reference_key=reference_key,
    )
    db.add(row)
    db.flush()
    return row


def _parse_days(raw: str) -> list[int]:
    if not raw:
        return []
    return [int(value) for value in raw.split(",") if value != ""]


def _reminder_due_on(reminder: MedicationReminder, day: date) -> bool:
    if not reminder.is_active:
        return False
    if day.weekday() not in _parse_days(reminder.days_of_week):
        return False
    start = date.fromisoformat(reminder.start_date)
    if day < start:
        return False
    if reminder.end_date:
        end = date.fromisoformat(reminder.end_date)
        if day > end:
            return False
    return True


def ensure_generated_notifications(db: Session, current_user: User) -> None:
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=24)

    upcoming = (
        db.query(Appointment)
        .filter(
            Appointment.user_id == current_user.id,
            Appointment.status.in_(["pending", "confirmed"]),
            Appointment.appointment_time >= now,
            Appointment.appointment_time <= window_end,
        )
        .all()
    )
    for row in upcoming:
        reference_key = f"appt-upcoming-{row.id}-{row.appointment_time.isoformat()}"
        local_time = row.appointment_time.astimezone().strftime("%b %d, %Y %I:%M %p")
        create_notification(
            db,
            user_id=current_user.id,
            kind="upcoming_appointment",
            title="Upcoming appointment",
            message=f"You have an appointment within 24 hours at {local_time}.",
            reference_key=reference_key,
        )

    missed_day = date.today() - timedelta(days=1)
    reminders = (
        db.query(MedicationReminder)
        .filter(MedicationReminder.user_id == current_user.id, MedicationReminder.is_active.is_(True))
        .all()
    )
    due_reminders = [row for row in reminders if _reminder_due_on(row, missed_day)]
    if not due_reminders:
        db.commit()
        return

    logs = (
        db.query(MedicationAdherenceLog)
        .filter(
            MedicationAdherenceLog.user_id == current_user.id,
            MedicationAdherenceLog.log_date == missed_day.isoformat(),
        )
        .all()
    )
    logged_ids = {row.reminder_id for row in logs}
    for row in due_reminders:
        if row.id in logged_ids:
            continue
        reference_key = f"reminder-missed-{row.id}-{missed_day.isoformat()}"
        create_notification(
            db,
            user_id=current_user.id,
            kind="missed_reminder",
            title="Missed medication reminder",
            message=f"No adherence log found for {row.medicine_name} on {missed_day.isoformat()}.",
            reference_key=reference_key,
        )

        caregiver_links = (
            db.query(CaregiverLink)
            .filter(
                CaregiverLink.patient_user_id == current_user.id,
                CaregiverLink.status == "active",
            )
            .all()
        )
        for link in caregiver_links:
            create_notification(
                db,
                user_id=link.caregiver_user_id,
                kind="caregiver_missed_reminder",
                title="Patient missed medication log",
                message=(
                    f"Patient {current_user.email} has no adherence log for "
                    f"{row.medicine_name} on {missed_day.isoformat()}."
                ),
                reference_key=f"caregiver-{link.caregiver_user_id}-{reference_key}",
            )

    db.commit()
