from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, date
from ..database import get_db
from ..models.models import (
    User, SentenceJourney, DailyReflection, ReflectionComment,
    JourneyVratmitra, VratmitraStatus
)
from ..schemas.schemas import (
    ReflectionOut, CreateReflectionRequest, UpdateReflectionRequest, AddCommentRequest
)
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/journeys/{journey_id}/reflections", tags=["reflections"])


def _get_journey_with_access(journey_id: str, user_id: str, db: Session):
    journey = db.query(SentenceJourney).options(
        joinedload(SentenceJourney.vratmitras)
    ).filter(SentenceJourney.id == journey_id).first()

    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    is_owner = journey.user_id == user_id
    is_vratmitra = any(
        v.user_id == user_id and v.status == VratmitraStatus.ACTIVE
        for v in journey.vratmitras
    )

    if not is_owner and not is_vratmitra:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return journey, is_owner


@router.get("", response_model=List[ReflectionOut])
def list_reflections(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_with_access(journey_id, current_user.id, db)

    return (
        db.query(DailyReflection)
        .options(
            joinedload(DailyReflection.comments).joinedload(ReflectionComment.user)
        )
        .filter(DailyReflection.journey_id == journey_id)
        .order_by(DailyReflection.date.desc())
        .all()
    )


@router.get("/today", response_model=ReflectionOut | None)
def get_today_reflection(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_with_access(journey_id, current_user.id, db)

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    reflection = db.query(DailyReflection).filter(
        DailyReflection.journey_id == journey_id,
        DailyReflection.date == today,
    ).first()
    return reflection


@router.post("", response_model=ReflectionOut)
def create_reflection(
    journey_id: str,
    req: CreateReflectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey, is_owner = _get_journey_with_access(journey_id, current_user.id, db)

    if not is_owner:
        raise HTTPException(status_code=403, detail="Only journey owner can add reflections")
    if journey.state != "ACTIVE":
        raise HTTPException(status_code=400, detail="Journey is not active")

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    existing = db.query(DailyReflection).filter(
        DailyReflection.journey_id == journey_id,
        DailyReflection.date == today,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Reflection already exists for today")

    reflection = DailyReflection(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        date=today,
        applied=req.applied,
        context_note=req.context_note,
        insight_note=req.insight_note,
        difficulty=req.difficulty,
    )
    db.add(reflection)
    db.commit()
    db.refresh(reflection)
    return reflection


@router.put("/{reflection_id}", response_model=ReflectionOut)
def update_reflection(
    journey_id: str,
    reflection_id: str,
    req: UpdateReflectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey, is_owner = _get_journey_with_access(journey_id, current_user.id, db)
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only journey owner can edit reflections")

    reflection = db.query(DailyReflection).filter(
        DailyReflection.id == reflection_id,
        DailyReflection.journey_id == journey_id,
    ).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    reflection_date = reflection.date.replace(hour=0, minute=0, second=0, microsecond=0)
    if reflection_date != today:
        raise HTTPException(status_code=400, detail="Cannot edit reflection from previous days")

    if req.applied is not None:
        reflection.applied = req.applied
    if req.context_note is not None:
        reflection.context_note = req.context_note
    if req.insight_note is not None:
        reflection.insight_note = req.insight_note
    if req.difficulty is not None:
        reflection.difficulty = req.difficulty

    db.commit()
    db.refresh(reflection)
    return reflection


@router.delete("/{reflection_id}")
def delete_reflection(
    journey_id: str,
    reflection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey, is_owner = _get_journey_with_access(journey_id, current_user.id, db)
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only journey owner can delete reflections")

    reflection = db.query(DailyReflection).filter(
        DailyReflection.id == reflection_id,
        DailyReflection.journey_id == journey_id,
    ).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    reflection_date = reflection.date.replace(hour=0, minute=0, second=0, microsecond=0)
    if reflection_date != today:
        raise HTTPException(status_code=400, detail="Cannot delete reflection from previous days")

    db.delete(reflection)
    db.commit()
    return {"success": True}


@router.post("/{reflection_id}/comments", response_model=ReflectionOut)
def add_comment(
    journey_id: str,
    reflection_id: str,
    req: AddCommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_with_access(journey_id, current_user.id, db)

    reflection = db.query(DailyReflection).filter(
        DailyReflection.id == reflection_id,
        DailyReflection.journey_id == journey_id,
    ).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    comment = ReflectionComment(
        id=str(uuid.uuid4()),
        reflection_id=reflection_id,
        user_id=current_user.id,
        text=req.text,
    )
    db.add(comment)
    db.commit()

    return (
        db.query(DailyReflection)
        .options(joinedload(DailyReflection.comments).joinedload(ReflectionComment.user))
        .filter(DailyReflection.id == reflection_id)
        .first()
    )
