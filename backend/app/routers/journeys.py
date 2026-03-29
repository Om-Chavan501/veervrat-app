from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models.models import (
    User, SentenceJourney, SentenceJourneyAssessmentLink, ResolutionInstance,
    LacunaAssessment, Sentence, JourneyState, SubVirtue, Virtue
)
from ..schemas.schemas import (
    JourneyOut, JourneyDetailOut, JourneyCountsOut, CreateJourneyRequest,
    SaveClarificationRequest, AddResolutionRequest, UpdateResolutionRequest,
    PauseJourneyRequest, ResolutionOut, ClarificationLinkOut
)
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/journeys", tags=["journeys"])


@router.get("/counts", response_model=JourneyCountsOut)
def journey_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = (
        db.query(SentenceJourney.state, func.count(SentenceJourney.id))
        .filter(SentenceJourney.user_id == current_user.id)
        .group_by(SentenceJourney.state)
        .all()
    )
    counts = {state.value: count for state, count in results}
    return JourneyCountsOut(
        ACTIVE=counts.get("ACTIVE", 0),
        INACTIVE=counts.get("INACTIVE", 0),
        COMPLETED=counts.get("COMPLETED", 0),
    )


@router.get("", response_model=List[JourneyOut])
def list_journeys(
    state: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(SentenceJourney)
        .options(
            joinedload(SentenceJourney.sentence)
            .joinedload(Sentence.sub_virtue)
            .joinedload(SubVirtue.virtue)
        )
        .filter(SentenceJourney.user_id == current_user.id)
    )
    if state:
        q = q.filter(SentenceJourney.state == state)
    return q.order_by(SentenceJourney.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=JourneyDetailOut)
def create_or_link_journey(
    req: CreateJourneyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.query(LacunaAssessment).filter(LacunaAssessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    journey = db.query(SentenceJourney).filter(
        SentenceJourney.user_id == current_user.id,
        SentenceJourney.sentence_id == req.sentence_id,
    ).first()

    if not journey:
        journey = SentenceJourney(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            sentence_id=req.sentence_id,
            state=JourneyState.ACTIVE,
        )
        db.add(journey)
        db.commit()
        db.refresh(journey)

    return _get_journey_detail(journey.id, db, current_user)


@router.get("/{journey_id}", response_model=JourneyDetailOut)
def get_journey(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_journey_detail(journey_id, db, current_user)


@router.post("/{journey_id}/clarify/{assessment_id}", response_model=ClarificationLinkOut)
def save_clarification(
    journey_id: str,
    assessment_id: str,
    req: SaveClarificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    assessment = db.query(LacunaAssessment).filter(LacunaAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    existing = db.query(SentenceJourneyAssessmentLink).filter(
        SentenceJourneyAssessmentLink.journey_id == journey_id,
        SentenceJourneyAssessmentLink.assessment_id == assessment_id,
    ).first()

    if existing:
        existing.virtue_relation_note = req.virtue_relation_note
        existing.lacuna_reduction_note = req.lacuna_reduction_note
        existing.unified_insight_note = req.unified_insight_note
        existing.personal_context_note = req.personal_context_note
        db.commit()
        db.refresh(existing)
        return existing
    else:
        link = SentenceJourneyAssessmentLink(
            id=str(uuid.uuid4()),
            journey_id=journey_id,
            assessment_id=assessment_id,
            virtue_relation_note=req.virtue_relation_note,
            lacuna_reduction_note=req.lacuna_reduction_note,
            unified_insight_note=req.unified_insight_note,
            personal_context_note=req.personal_context_note,
        )
        db.add(link)
        db.commit()
        db.refresh(link)
        return link


@router.get("/{journey_id}/clarifications", response_model=List[ClarificationLinkOut])
def list_clarifications(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return (
        db.query(SentenceJourneyAssessmentLink)
        .options(joinedload(SentenceJourneyAssessmentLink.assessment).joinedload(LacunaAssessment.lacuna))
        .filter(SentenceJourneyAssessmentLink.journey_id == journey_id)
        .order_by(SentenceJourneyAssessmentLink.created_at.desc())
        .all()
    )


@router.post("/{journey_id}/resolutions", response_model=ResolutionOut)
def add_resolution(
    journey_id: str,
    req: AddResolutionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if journey.state != JourneyState.ACTIVE:
        raise HTTPException(status_code=400, detail="Cannot add resolutions to inactive journey")

    link_count = db.query(SentenceJourneyAssessmentLink).filter(
        SentenceJourneyAssessmentLink.journey_id == journey_id
    ).count()
    if link_count == 0:
        raise HTTPException(status_code=400, detail="Must complete clarification before adding resolutions")

    resolution = ResolutionInstance(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        text=req.text,
        frequency=req.frequency,
    )
    db.add(resolution)
    db.commit()
    db.refresh(resolution)
    return resolution


@router.put("/{journey_id}/resolutions/{resolution_id}", response_model=ResolutionOut)
def update_resolution(
    journey_id: str,
    resolution_id: str,
    req: UpdateResolutionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolution = (
        db.query(ResolutionInstance)
        .filter(ResolutionInstance.id == resolution_id, ResolutionInstance.journey_id == journey_id)
        .first()
    )
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")

    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if journey.state != JourneyState.ACTIVE:
        raise HTTPException(status_code=400, detail="Cannot edit resolutions on inactive journey")

    resolution.text = req.text
    resolution.frequency = req.frequency
    db.commit()
    db.refresh(resolution)
    return resolution


@router.delete("/{journey_id}/resolutions/{resolution_id}")
def delete_resolution(
    journey_id: str,
    resolution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolution = (
        db.query(ResolutionInstance)
        .filter(ResolutionInstance.id == resolution_id, ResolutionInstance.journey_id == journey_id)
        .first()
    )
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")

    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if journey.state != JourneyState.ACTIVE:
        raise HTTPException(status_code=400, detail="Cannot delete resolutions from inactive journey")

    db.delete(resolution)
    db.commit()
    return {"success": True}


@router.post("/{journey_id}/pause", response_model=JourneyOut)
def pause_journey(
    journey_id: str,
    req: PauseJourneyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if journey.state != JourneyState.ACTIVE:
        raise HTTPException(status_code=400, detail="Can only pause active journeys")

    journey.state = JourneyState.INACTIVE
    journey.inactive_at = datetime.utcnow()
    journey.inactive_reason = req.reason
    db.commit()
    db.refresh(journey)
    return journey


@router.post("/{journey_id}/resume", response_model=JourneyOut)
def resume_journey(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if journey.state != JourneyState.INACTIVE:
        raise HTTPException(status_code=400, detail="Can only resume inactive journeys")

    journey.state = JourneyState.ACTIVE
    journey.inactive_at = None
    journey.inactive_reason = None
    db.commit()
    db.refresh(journey)
    return journey


@router.post("/{journey_id}/complete", response_model=JourneyOut)
def complete_journey(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from ..models.models import DailyReflection
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if journey.state != JourneyState.ACTIVE:
        raise HTTPException(status_code=400, detail="Can only complete active journeys")

    reflection_count = db.query(DailyReflection).filter(
        DailyReflection.journey_id == journey_id
    ).count()
    if reflection_count == 0:
        raise HTTPException(status_code=400, detail="Cannot complete journey without at least one reflection")

    journey.state = JourneyState.COMPLETED
    db.commit()
    db.refresh(journey)
    return journey


def _get_journey_detail(journey_id: str, db: Session, current_user: User) -> SentenceJourney:
    journey = (
        db.query(SentenceJourney)
        .options(
            joinedload(SentenceJourney.sentence)
            .joinedload(Sentence.sub_virtue)
            .joinedload(SubVirtue.virtue),
            joinedload(SentenceJourney.links)
            .joinedload(SentenceJourneyAssessmentLink.assessment)
            .joinedload(LacunaAssessment.lacuna),
            joinedload(SentenceJourney.resolutions),
        )
        .filter(SentenceJourney.id == journey_id)
        .first()
    )
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return journey
