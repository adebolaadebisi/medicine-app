import json

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import MealPlan, User
from ..schemas import MealPlanCreate, MealPlanOut

router = APIRouter(prefix="/meal-plans", tags=["meal-plans"])


def to_out(row: MealPlan) -> MealPlanOut:
    return MealPlanOut(
        id=row.id,
        user_id=row.user_id,
        plan_type=row.plan_type,
        condition=row.condition,
        goal=row.goal,
        activity=row.activity,
        data=json.loads(row.data),
        created_at=row.created_at,
    )


@router.post("", response_model=MealPlanOut, status_code=status.HTTP_201_CREATED)
def create_meal_plan(
    payload: MealPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = MealPlan(
        user_id=current_user.id,
        plan_type=payload.plan_type,
        condition=payload.condition,
        goal=payload.goal,
        activity=payload.activity,
        data=json.dumps(payload.data),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return to_out(row)


@router.get("", response_model=list[MealPlanOut])
def list_meal_plans(
    plan_type: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MealPlan).filter(MealPlan.user_id == current_user.id)
    if plan_type:
        query = query.filter(MealPlan.plan_type == plan_type)

    rows = query.order_by(MealPlan.created_at.desc()).limit(limit).all()
    return [to_out(row) for row in rows]
