from sqlalchemy.orm import Session

from .models import Doctor


def seed_doctors(db: Session) -> None:
    if db.query(Doctor).count() > 0:
        return

    doctors = [
        Doctor(name="Dr. Adeyemi", specialty="General Physician", location="Lagos", experience_years=9),
        Doctor(name="Dr. Nwosu", specialty="General Physician", location="Abuja", experience_years=7),
        Doctor(name="Dr. Bello", specialty="Cardiologist", location="Ibadan", experience_years=11),
        Doctor(name="Dr. Hassan", specialty="Dermatologist", location="Port Harcourt", experience_years=8),
        Doctor(name="Dr. Okafor", specialty="Nutritionist", location="Lagos", experience_years=6),
        Doctor(name="Dr. Chinedu", specialty="Neurologist", location="Abuja", experience_years=10),
        Doctor(name="Dr. Ijeoma", specialty="Neurologist", location="Enugu", experience_years=12),
    ]
    db.add_all(doctors)
    db.commit()
