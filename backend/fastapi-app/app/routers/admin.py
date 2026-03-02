import json

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_admin_user
from ..models import Doctor, FoodCheck, MealPlan, User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def admin_overview(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_doctors = db.query(func.count(Doctor.id)).scalar() or 0
    total_food_checks = db.query(func.count(FoodCheck.id)).scalar() or 0
    total_meal_plans = db.query(func.count(MealPlan.id)).scalar() or 0

    recent_users = (
        db.query(User)
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

    return {
        "stats": {
            "total_users": total_users,
            "total_doctors": total_doctors,
            "total_food_checks": total_food_checks,
            "total_meal_plans": total_meal_plans,
        },
        "recent_users": [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at,
            }
            for user in recent_users
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
    }
