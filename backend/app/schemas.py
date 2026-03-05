from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None
    account_type: str = Field(default="patient", pattern="^(patient|caregiver)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    is_admin: bool = False
    is_caregiver: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DoctorOut(BaseModel):
    id: int
    name: str
    specialty: str
    location: str | None = None
    experience_years: int | None = None
    bio: str | None = None

    model_config = {"from_attributes": True}


class FoodCheckCreate(BaseModel):
    name: str
    expiry: str
    status: str
    message: str
    days_until_expiry: int


class FoodCheckOut(FoodCheckCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MealPlanCreate(BaseModel):
    plan_type: str = "daily"
    condition: str
    goal: str | None = None
    activity: str | None = None
    data: dict


class MealPlanOut(BaseModel):
    id: int
    user_id: int
    plan_type: str
    condition: str
    goal: str | None
    activity: str | None
    data: dict
    created_at: datetime


class MedicationReminderBase(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=255)
    dosage: str = Field(min_length=1, max_length=120)
    reminder_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    days_of_week: list[int] = Field(min_length=1)
    instructions: str | None = None
    start_date: date
    end_date: date | None = None
    is_active: bool = True


class MedicationReminderCreate(MedicationReminderBase):
    pass


class MedicationReminderUpdate(BaseModel):
    medicine_name: str | None = Field(default=None, min_length=1, max_length=255)
    dosage: str | None = Field(default=None, min_length=1, max_length=120)
    reminder_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    days_of_week: list[int] | None = Field(default=None, min_length=1)
    instructions: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class MedicationReminderOut(BaseModel):
    id: int
    user_id: int
    medicine_name: str
    dosage: str
    reminder_time: str
    days_of_week: list[int]
    instructions: str | None
    start_date: date
    end_date: date | None
    is_active: bool
    created_at: datetime


class MedicationAdherenceCreate(BaseModel):
    status: str = Field(pattern="^(taken|skipped)$")
    log_date: date | None = None


class MedicationAdherenceOut(BaseModel):
    id: int
    user_id: int
    reminder_id: int
    log_date: date
    status: str
    logged_at: datetime


class DailyAdherenceItem(BaseModel):
    reminder_id: int
    medicine_name: str
    dosage: str
    reminder_time: str
    status: str | None = None
    log_id: int | None = None


class DailyAdherenceSummary(BaseModel):
    date: date
    total_due: int
    taken: int
    skipped: int
    pending: int
    adherence_rate: float
    items: list[DailyAdherenceItem]


class AdherenceTrendPoint(BaseModel):
    date: date
    total_due: int
    taken: int
    skipped: int
    pending: int
    adherence_rate: float


class AdherenceTrendOut(BaseModel):
    days: int
    points: list[AdherenceTrendPoint]


class AdminPasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str | None = Field(default=None, min_length=8, max_length=128)


class AdminPasswordResetResponse(BaseModel):
    email: EmailStr
    temporary_password: str
    reset_at: datetime


class TimelineItemOut(BaseModel):
    id: str
    event_type: str
    title: str
    description: str | None = None
    occurred_at: datetime
    meta: dict = {}


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_time: datetime
    mode: str = Field(default="video", pattern="^(video|in_person)$")
    reason: str | None = None


class AppointmentRescheduleRequest(BaseModel):
    appointment_time: datetime
    reason: str | None = None


class AdminAppointmentUpdateRequest(BaseModel):
    status: str = Field(pattern="^(pending|confirmed|completed|cancelled|rejected)$")
    admin_notes: str | None = None


class AppointmentOut(BaseModel):
    id: int
    user_id: int
    doctor_id: int
    doctor_name: str
    doctor_specialty: str
    appointment_time: datetime
    mode: str
    status: str
    reason: str | None
    admin_notes: str | None
    created_at: datetime


class NotificationOut(BaseModel):
    id: int
    kind: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    read_at: datetime | None


class NotificationUnreadCountOut(BaseModel):
    unread_count: int


class VitalEntryCreate(BaseModel):
    measured_at: datetime | None = None
    systolic_bp: int | None = Field(default=None, ge=50, le=300)
    diastolic_bp: int | None = Field(default=None, ge=30, le=200)
    glucose_mg_dl: int | None = Field(default=None, ge=20, le=700)
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    heart_rate_bpm: int | None = Field(default=None, ge=20, le=250)
    note: str | None = None

    @model_validator(mode="after")
    def validate_payload(self):
        has_any = any(
            value is not None
            for value in [
                self.systolic_bp,
                self.diastolic_bp,
                self.glucose_mg_dl,
                self.weight_kg,
                self.heart_rate_bpm,
            ]
        )
        if not has_any:
            raise ValueError("At least one vital metric is required")
        if (self.systolic_bp is None) != (self.diastolic_bp is None):
            raise ValueError("Both systolic_bp and diastolic_bp are required for blood pressure")
        return self


class VitalEntryOut(BaseModel):
    id: int
    user_id: int
    measured_at: datetime
    systolic_bp: int | None
    diastolic_bp: int | None
    glucose_mg_dl: int | None
    weight_kg: float | None
    heart_rate_bpm: int | None
    note: str | None
    created_at: datetime


class VitalSeriesPoint(BaseModel):
    date: date
    value: float


class VitalTrendsOut(BaseModel):
    days: int
    blood_pressure_systolic: list[VitalSeriesPoint]
    blood_pressure_diastolic: list[VitalSeriesPoint]
    glucose: list[VitalSeriesPoint]
    weight: list[VitalSeriesPoint]
    heart_rate: list[VitalSeriesPoint]


class VitalFlagOut(BaseModel):
    metric: str
    level: str
    emergency: bool = False
    message: str
    measured_at: datetime


class CaregiverInviteRequest(BaseModel):
    caregiver_email: EmailStr


class CaregiverLinkOut(BaseModel):
    id: int
    patient_user_id: int
    caregiver_user_id: int
    patient_email: EmailStr
    caregiver_email: EmailStr
    status: str
    created_at: datetime
    accepted_at: datetime | None


class CaregiverPatientOverviewOut(BaseModel):
    patient_id: int
    patient_email: EmailStr
    patient_name: str | None
    recent_vitals: list[VitalEntryOut]
    recent_vital_flags: list[VitalFlagOut]
    upcoming_appointments: list[AppointmentOut]
