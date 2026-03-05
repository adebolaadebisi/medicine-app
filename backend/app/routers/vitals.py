from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import CaregiverLink, User, VitalEntry
from ..notifications_service import create_notification
from ..schemas import (
    VitalEntryCreate,
    VitalEntryOut,
    VitalFlagOut,
    VitalSeriesPoint,
    VitalTrendsOut,
)

router = APIRouter(prefix="/vitals", tags=["vitals"])


def evaluate_flags(row: VitalEntry) -> list[VitalFlagOut]:
    flags: list[VitalFlagOut] = []
    if row.systolic_bp is not None and row.diastolic_bp is not None:
        if row.systolic_bp >= 180 or row.diastolic_bp >= 120:
            flags.append(
                VitalFlagOut(
                    metric="blood_pressure",
                    level="critical",
                    emergency=True,
                    message=(
                        f"Critical blood pressure reading: {row.systolic_bp}/{row.diastolic_bp} mmHg. "
                        "Seek urgent medical attention."
                    ),
                    measured_at=row.measured_at,
                )
            )
        elif row.systolic_bp >= 140 or row.diastolic_bp >= 90:
            flags.append(
                VitalFlagOut(
                    metric="blood_pressure",
                    level="high",
                    message=f"High blood pressure reading: {row.systolic_bp}/{row.diastolic_bp} mmHg.",
                    measured_at=row.measured_at,
                )
            )
    if row.glucose_mg_dl is not None:
        if row.glucose_mg_dl >= 300:
            flags.append(
                VitalFlagOut(
                    metric="glucose",
                    level="critical",
                    emergency=True,
                    message=(
                        f"Critical glucose reading: {row.glucose_mg_dl} mg/dL. "
                        "Seek urgent medical attention."
                    ),
                    measured_at=row.measured_at,
                )
            )
        elif row.glucose_mg_dl >= 180:
            flags.append(
                VitalFlagOut(
                    metric="glucose",
                    level="high",
                    message=f"High glucose reading: {row.glucose_mg_dl} mg/dL.",
                    measured_at=row.measured_at,
                )
            )
        elif row.glucose_mg_dl < 54:
            flags.append(
                VitalFlagOut(
                    metric="glucose",
                    level="critical",
                    emergency=True,
                    message=(
                        f"Critical low glucose reading: {row.glucose_mg_dl} mg/dL. "
                        "Seek urgent medical attention."
                    ),
                    measured_at=row.measured_at,
                )
            )
        elif row.glucose_mg_dl < 70:
            flags.append(
                VitalFlagOut(
                    metric="glucose",
                    level="low",
                    message=f"Low glucose reading: {row.glucose_mg_dl} mg/dL.",
                    measured_at=row.measured_at,
                )
            )
    if row.heart_rate_bpm is not None:
        if row.heart_rate_bpm >= 130:
            flags.append(
                VitalFlagOut(
                    metric="heart_rate",
                    level="critical",
                    emergency=True,
                    message=(
                        f"Critical high heart rate reading: {row.heart_rate_bpm} bpm. "
                        "Seek urgent medical attention."
                    ),
                    measured_at=row.measured_at,
                )
            )
        elif row.heart_rate_bpm > 100:
            flags.append(
                VitalFlagOut(
                    metric="heart_rate",
                    level="high",
                    message=f"Elevated heart rate reading: {row.heart_rate_bpm} bpm.",
                    measured_at=row.measured_at,
                )
            )
        elif row.heart_rate_bpm < 40:
            flags.append(
                VitalFlagOut(
                    metric="heart_rate",
                    level="critical",
                    emergency=True,
                    message=(
                        f"Critical low heart rate reading: {row.heart_rate_bpm} bpm. "
                        "Seek urgent medical attention."
                    ),
                    measured_at=row.measured_at,
                )
            )
        elif row.heart_rate_bpm < 50:
            flags.append(
                VitalFlagOut(
                    metric="heart_rate",
                    level="low",
                    message=f"Low heart rate reading: {row.heart_rate_bpm} bpm.",
                    measured_at=row.measured_at,
                )
            )
    return flags


@router.post("", response_model=VitalEntryOut, status_code=status.HTTP_201_CREATED)
def create_vital_entry(
    payload: VitalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    measured_at = payload.measured_at or datetime.now(timezone.utc)
    row = VitalEntry(
        user_id=current_user.id,
        measured_at=measured_at,
        systolic_bp=payload.systolic_bp,
        diastolic_bp=payload.diastolic_bp,
        glucose_mg_dl=payload.glucose_mg_dl,
        weight_kg=payload.weight_kg,
        heart_rate_bpm=payload.heart_rate_bpm,
        note=payload.note.strip() if payload.note else None,
    )
    db.add(row)
    db.flush()

    flags = evaluate_flags(row)
    active_caregiver_links = (
        db.query(CaregiverLink)
        .filter(
            CaregiverLink.patient_user_id == current_user.id,
            CaregiverLink.status == "active",
        )
        .all()
    )
    for flag in flags:
        if flag.emergency:
            create_notification(
                db,
                user_id=current_user.id,
                kind="emergency_alert",
                title="Emergency warning",
                message=flag.message,
                reference_key=f"vital-emergency-{row.id}-{flag.metric}-{flag.level}",
            )
            for link in active_caregiver_links:
                create_notification(
                    db,
                    user_id=link.caregiver_user_id,
                    kind="caregiver_emergency_alert",
                    title="Patient emergency warning",
                    message=f"Patient {current_user.email}: {flag.message}",
                    reference_key=(
                        f"caregiver-{link.caregiver_user_id}-"
                        f"vital-emergency-{row.id}-{flag.metric}-{flag.level}"
                    ),
                )
        else:
            create_notification(
                db,
                user_id=current_user.id,
                kind="vital_flag",
                title=f"Vital alert: {flag.metric}",
                message=flag.message,
                reference_key=f"vital-flag-{row.id}-{flag.metric}-{flag.level}",
            )

    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[VitalEntryOut])
def list_vital_entries(
    limit: int = Query(default=50, ge=1, le=300),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(VitalEntry)
        .filter(VitalEntry.user_id == current_user.id)
        .order_by(VitalEntry.measured_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/trends", response_model=VitalTrendsOut)
def get_vital_trends(
    days: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(VitalEntry)
        .filter(VitalEntry.user_id == current_user.id, VitalEntry.measured_at >= since)
        .order_by(VitalEntry.measured_at.asc())
        .all()
    )

    buckets: dict[str, dict[str, list[float]]] = defaultdict(
        lambda: {
            "systolic": [],
            "diastolic": [],
            "glucose": [],
            "weight": [],
            "heart_rate": [],
        }
    )
    for row in rows:
        key = row.measured_at.date().isoformat()
        if row.systolic_bp is not None:
            buckets[key]["systolic"].append(float(row.systolic_bp))
        if row.diastolic_bp is not None:
            buckets[key]["diastolic"].append(float(row.diastolic_bp))
        if row.glucose_mg_dl is not None:
            buckets[key]["glucose"].append(float(row.glucose_mg_dl))
        if row.weight_kg is not None:
            buckets[key]["weight"].append(float(row.weight_kg))
        if row.heart_rate_bpm is not None:
            buckets[key]["heart_rate"].append(float(row.heart_rate_bpm))

    def to_series(metric_key: str) -> list[VitalSeriesPoint]:
        points: list[VitalSeriesPoint] = []
        for date_key in sorted(buckets.keys()):
            values = buckets[date_key][metric_key]
            if not values:
                continue
            avg = round(sum(values) / len(values), 2)
            points.append(VitalSeriesPoint(date=date.fromisoformat(date_key), value=avg))
        return points

    return VitalTrendsOut(
        days=days,
        blood_pressure_systolic=to_series("systolic"),
        blood_pressure_diastolic=to_series("diastolic"),
        glucose=to_series("glucose"),
        weight=to_series("weight"),
        heart_rate=to_series("heart_rate"),
    )


@router.get("/flags", response_model=list[VitalFlagOut])
def get_vital_flags(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(VitalEntry)
        .filter(VitalEntry.user_id == current_user.id, VitalEntry.measured_at >= since)
        .order_by(VitalEntry.measured_at.desc())
        .limit(limit * 3)
        .all()
    )
    flags: list[VitalFlagOut] = []
    for row in rows:
        flags.extend(evaluate_flags(row))
    flags.sort(key=lambda item: item.measured_at, reverse=True)
    return flags[:limit]
