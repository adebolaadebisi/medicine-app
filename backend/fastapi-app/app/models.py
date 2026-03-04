from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    food_checks: Mapped[list["FoodCheck"]] = relationship(back_populates="user")
    meal_plans: Mapped[list["MealPlan"]] = relationship(back_populates="user")
    medication_reminders: Mapped[list["MedicationReminder"]] = relationship(
        back_populates="user"
    )
    medication_adherence_logs: Mapped[list["MedicationAdherenceLog"]] = relationship(
        back_populates="user"
    )
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    vital_entries: Mapped[list["VitalEntry"]] = relationship(back_populates="user")
    caregiver_links_as_patient: Mapped[list["CaregiverLink"]] = relationship(
        back_populates="patient_user",
        foreign_keys="CaregiverLink.patient_user_id",
    )
    caregiver_links_as_caregiver: Mapped[list["CaregiverLink"]] = relationship(
        back_populates="caregiver_user",
        foreign_keys="CaregiverLink.caregiver_user_id",
    )
    caregiver_profile: Mapped["CaregiverProfile | None"] = relationship(
        back_populates="user",
        uselist=False,
    )


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    specialty: Mapped[str] = mapped_column(String(120), index=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")


class FoodCheck(Base):
    __tablename__ = "food_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    expiry: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text)
    days_until_expiry: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="food_checks")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    plan_type: Mapped[str] = mapped_column(String(50), default="daily", index=True)
    condition: Mapped[str] = mapped_column(String(120), index=True)
    goal: Mapped[str | None] = mapped_column(String(120), nullable=True)
    activity: Mapped[str | None] = mapped_column(String(120), nullable=True)
    data: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="meal_plans")


class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    medicine_name: Mapped[str] = mapped_column(String(255), index=True)
    dosage: Mapped[str] = mapped_column(String(120))
    reminder_time: Mapped[str] = mapped_column(String(5), index=True)
    days_of_week: Mapped[str] = mapped_column(String(32))
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[str] = mapped_column(String(10), index=True)
    end_date: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="medication_reminders")
    adherence_logs: Mapped[list["MedicationAdherenceLog"]] = relationship(
        back_populates="reminder"
    )


class MedicationAdherenceLog(Base):
    __tablename__ = "medication_adherence_logs"
    __table_args__ = (
        UniqueConstraint("reminder_id", "log_date", name="uq_reminder_log_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reminder_id: Mapped[int] = mapped_column(
        ForeignKey("medication_reminders.id"), index=True
    )
    log_date: Mapped[str] = mapped_column(String(10), index=True)
    status: Mapped[str] = mapped_column(String(20))
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="medication_adherence_logs")
    reminder: Mapped[MedicationReminder] = relationship(back_populates="adherence_logs")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), index=True)
    appointment_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    mode: Mapped[str] = mapped_column(String(20), default="video")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="appointments")
    doctor: Mapped[Doctor] = relationship(back_populates="appointments")


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("user_id", "reference_key", name="uq_notification_user_reference_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    reference_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User] = relationship(back_populates="notifications")


class VitalEntry(Base):
    __tablename__ = "vital_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    systolic_bp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diastolic_bp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    glucose_mg_dl: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(nullable=True)
    heart_rate_bpm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="vital_entries")


class CaregiverLink(Base):
    __tablename__ = "caregiver_links"
    __table_args__ = (
        UniqueConstraint(
            "patient_user_id",
            "caregiver_user_id",
            name="uq_caregiver_link_patient_caregiver",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    caregiver_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    patient_user: Mapped[User] = relationship(
        back_populates="caregiver_links_as_patient",
        foreign_keys=[patient_user_id],
    )
    caregiver_user: Mapped[User] = relationship(
        back_populates="caregiver_links_as_caregiver",
        foreign_keys=[caregiver_user_id],
    )


class CaregiverProfile(Base):
    __tablename__ = "caregiver_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="caregiver_profile")
