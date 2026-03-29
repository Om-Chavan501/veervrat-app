from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models.models import User, SentenceJourney, DailyReflection, JourneyVratmitra, VratmitraStatus
from ..schemas.schemas import UserOut, UserProfileUpdate, DashboardStats, UserSearchItem
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(
    req: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.name:
        current_user.name = req.name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/search", response_model=List[UserSearchItem])
def search_users(
    q: str = Query(default=""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(q) < 2:
        return []
    pattern = f"%{q.lower()}%"
    return (
        db.query(User)
        .filter(
            (func.lower(User.name).like(pattern)) | (func.lower(User.email).like(pattern)),
            User.id != current_user.id,
        )
        .limit(10)
        .all()
    )


@router.get("/me/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    active_journeys = db.query(SentenceJourney).filter(
        SentenceJourney.user_id == current_user.id,
        SentenceJourney.state == "ACTIVE",
    ).count()

    completed_journeys = db.query(SentenceJourney).filter(
        SentenceJourney.user_id == current_user.id,
        SentenceJourney.state == "COMPLETED",
    ).count()

    journey_ids = [
        j.id for j in db.query(SentenceJourney.id).filter(
            SentenceJourney.user_id == current_user.id
        ).all()
    ]

    total_reflections = db.query(DailyReflection).filter(
        DailyReflection.journey_id.in_(journey_ids)
    ).count() if journey_ids else 0

    pending_invitations = db.query(JourneyVratmitra).filter(
        JourneyVratmitra.user_id == current_user.id,
        JourneyVratmitra.status == VratmitraStatus.PENDING,
    ).count()

    return DashboardStats(
        active_journeys=active_journeys,
        total_reflections=total_reflections,
        pending_invitations=pending_invitations,
        completed_journeys=completed_journeys,
    )
