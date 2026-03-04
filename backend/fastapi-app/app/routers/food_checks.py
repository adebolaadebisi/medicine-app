from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import FoodCheck, User
from ..schemas import FoodCheckCreate, FoodCheckOut

router = APIRouter(prefix="/food-checks", tags=["food-checks"])


@router.post("", response_model=FoodCheckOut, status_code=status.HTTP_201_CREATED)
def create_food_check(
    payload: FoodCheckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = FoodCheck(user_id=current_user.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[FoodCheckOut])
def list_food_checks(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(FoodCheck)
        .filter(FoodCheck.user_id == current_user.id)
        .order_by(FoodCheck.created_at.desc())
        .limit(limit)
        .all()
    )
