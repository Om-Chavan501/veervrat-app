from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models.models import (
    User, SentenceJourney, JourneyState,
    ExposureCatalogItem, ResolutionCatalogItem, ChallengeCatalogItem,
    JourneyExposure, JourneyResolution, JourneyChallenge,
    ExposureStatus, ResolutionStatus, ChallengeStatus,
)
from ..schemas.schemas import (
    ExposureCatalogItemOut, ResolutionCatalogItemOut, ChallengeCatalogItemOut,
    JourneyExposureOut, JourneyExposureCreate, JourneyExposureUpdate,
    JourneyResolutionOut, JourneyResolutionCreate, JourneyResolutionUpdate,
    JourneyChallengeOut, JourneyChallengeCreate, ChallengeOutcome,
)
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(tags=["activities"])


def _get_journey_or_404(journey_id: str, db: Session, user_id: str) -> SentenceJourney:
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return journey


# ─────────────────────────────────────────
# CATALOG ENDPOINTS
# ─────────────────────────────────────────

@router.get("/catalog/exposures", response_model=List[ExposureCatalogItemOut])
def get_catalog_exposures(
    sentence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ExposureCatalogItem)
        .filter(ExposureCatalogItem.sentence_id == sentence_id)
        .all()
    )


@router.get("/catalog/resolutions", response_model=List[ResolutionCatalogItemOut])
def get_catalog_resolutions(
    sentence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ResolutionCatalogItem)
        .filter(ResolutionCatalogItem.sentence_id == sentence_id)
        .all()
    )


@router.get("/catalog/challenges", response_model=List[ChallengeCatalogItemOut])
def get_catalog_challenges(
    sentence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChallengeCatalogItem)
        .filter(ChallengeCatalogItem.sentence_id == sentence_id)
        .all()
    )


# ─────────────────────────────────────────
# JOURNEY EXPOSURES
# ─────────────────────────────────────────

@router.get("/journeys/{journey_id}/exposures", response_model=List[JourneyExposureOut])
def list_exposures(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    return (
        db.query(JourneyExposure)
        .filter(JourneyExposure.journey_id == journey_id)
        .order_by(JourneyExposure.created_at.asc())
        .all()
    )


@router.post("/journeys/{journey_id}/exposures", response_model=JourneyExposureOut)
def add_exposure(
    journey_id: str,
    req: JourneyExposureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    exposure = JourneyExposure(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        catalog_item_id=req.catalog_item_id,
        title=req.title,
        description=req.description,
        status=ExposureStatus.PLANNED,
    )
    db.add(exposure)
    db.commit()
    db.refresh(exposure)
    return exposure


@router.put("/journeys/{journey_id}/exposures/{exposure_id}", response_model=JourneyExposureOut)
def update_exposure(
    journey_id: str,
    exposure_id: str,
    req: JourneyExposureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    exposure = db.query(JourneyExposure).filter(
        JourneyExposure.id == exposure_id,
        JourneyExposure.journey_id == journey_id,
    ).first()
    if not exposure:
        raise HTTPException(status_code=404, detail="Exposure not found")

    if req.title is not None:
        exposure.title = req.title
    if req.description is not None:
        exposure.description = req.description
    if req.status is not None:
        exposure.status = req.status
        if req.status == ExposureStatus.TAKEN and not exposure.taken_at:
            exposure.taken_at = datetime.utcnow()
        elif req.status != ExposureStatus.TAKEN:
            exposure.taken_at = None

    db.commit()
    db.refresh(exposure)
    return exposure


@router.delete("/journeys/{journey_id}/exposures/{exposure_id}")
def delete_exposure(
    journey_id: str,
    exposure_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    exposure = db.query(JourneyExposure).filter(
        JourneyExposure.id == exposure_id,
        JourneyExposure.journey_id == journey_id,
    ).first()
    if not exposure:
        raise HTTPException(status_code=404, detail="Exposure not found")
    db.delete(exposure)
    db.commit()
    return {"success": True}


# ─────────────────────────────────────────
# JOURNEY RESOLUTIONS
# ─────────────────────────────────────────

@router.get("/journeys/{journey_id}/resolutions", response_model=List[JourneyResolutionOut])
def list_resolutions(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    return (
        db.query(JourneyResolution)
        .filter(JourneyResolution.journey_id == journey_id)
        .order_by(JourneyResolution.created_at.asc())
        .all()
    )


@router.post("/journeys/{journey_id}/resolutions", response_model=JourneyResolutionOut)
def add_resolution(
    journey_id: str,
    req: JourneyResolutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    resolution = JourneyResolution(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        catalog_item_id=req.catalog_item_id,
        title=req.title,
        description=req.description,
        frequency=req.frequency,
        status=ResolutionStatus.ACTIVE,
    )
    db.add(resolution)
    db.commit()
    db.refresh(resolution)
    return resolution


@router.put("/journeys/{journey_id}/resolutions/{resolution_id}", response_model=JourneyResolutionOut)
def update_resolution(
    journey_id: str,
    resolution_id: str,
    req: JourneyResolutionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    resolution = db.query(JourneyResolution).filter(
        JourneyResolution.id == resolution_id,
        JourneyResolution.journey_id == journey_id,
    ).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")

    if req.title is not None:
        resolution.title = req.title
    if req.description is not None:
        resolution.description = req.description
    if req.frequency is not None:
        resolution.frequency = req.frequency
    if req.status is not None:
        resolution.status = req.status

    db.commit()
    db.refresh(resolution)
    return resolution


@router.delete("/journeys/{journey_id}/resolutions/{resolution_id}")
def delete_resolution(
    journey_id: str,
    resolution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    resolution = db.query(JourneyResolution).filter(
        JourneyResolution.id == resolution_id,
        JourneyResolution.journey_id == journey_id,
    ).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    db.delete(resolution)
    db.commit()
    return {"success": True}


# ─────────────────────────────────────────
# JOURNEY CHALLENGE
# ─────────────────────────────────────────

@router.get("/journeys/{journey_id}/challenge", response_model=JourneyChallengeOut)
def get_challenge(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    challenge = db.query(JourneyChallenge).filter(
        JourneyChallenge.journey_id == journey_id,
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="No challenge set for this journey")
    return challenge


@router.post("/journeys/{journey_id}/challenge", response_model=JourneyChallengeOut)
def add_challenge(
    journey_id: str,
    req: JourneyChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)

    existing = db.query(JourneyChallenge).filter(
        JourneyChallenge.journey_id == journey_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Journey already has a challenge. Delete it first.")

    challenge = JourneyChallenge(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        catalog_item_id=req.catalog_item_id,
        title=req.title,
        description=req.description,
        achievement_criteria=req.achievement_criteria,
        status=ChallengeStatus.PLANNED,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge


@router.post("/journeys/{journey_id}/challenge/outcome", response_model=JourneyChallengeOut)
def set_challenge_outcome(
    journey_id: str,
    req: ChallengeOutcome,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    challenge = db.query(JourneyChallenge).filter(
        JourneyChallenge.journey_id == journey_id,
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="No challenge set for this journey")
    if challenge.status != ChallengeStatus.PLANNED:
        raise HTTPException(status_code=400, detail="Challenge outcome already set")
    if req.outcome not in (ChallengeStatus.COMPLETED, ChallengeStatus.ABANDONED):
        raise HTTPException(status_code=400, detail="Outcome must be COMPLETED or ABANDONED")

    challenge.status = req.outcome
    if req.outcome == ChallengeStatus.COMPLETED:
        challenge.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(challenge)
    return challenge


@router.delete("/journeys/{journey_id}/challenge")
def delete_challenge(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_journey_or_404(journey_id, db, current_user.id)
    challenge = db.query(JourneyChallenge).filter(
        JourneyChallenge.journey_id == journey_id,
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="No challenge set for this journey")
    db.delete(challenge)
    db.commit()
    return {"success": True}
