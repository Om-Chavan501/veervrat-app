from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import User, SentenceJourney, ExposureInstance, JourneyVratmitra, VratmitraStatus
from ..schemas.schemas import ExposureOut, CreateExposureRequest, UpdateExposureRequest
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/journeys/{journey_id}/exposures", tags=["exposures"])


def _check_access(journey_id: str, user_id: str, db: Session, require_owner=False):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    is_owner = journey.user_id == user_id
    if require_owner and not is_owner:
        raise HTTPException(status_code=403, detail="Only journey owner can perform this action")

    if not is_owner:
        vratmitra = db.query(JourneyVratmitra).filter(
            JourneyVratmitra.journey_id == journey_id,
            JourneyVratmitra.user_id == user_id,
            JourneyVratmitra.status == VratmitraStatus.ACTIVE,
        ).first()
        if not vratmitra:
            raise HTTPException(status_code=403, detail="Unauthorized")

    return journey, is_owner


@router.get("", response_model=List[ExposureOut])
def list_exposures(journey_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_access(journey_id, current_user.id, db)
    return (
        db.query(ExposureInstance)
        .filter(ExposureInstance.journey_id == journey_id)
        .order_by(ExposureInstance.created_at.desc())
        .all()
    )


@router.post("", response_model=ExposureOut)
def create_exposure(
    journey_id: str,
    req: CreateExposureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_access(journey_id, current_user.id, db, require_owner=True)

    exposure = ExposureInstance(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        description=req.description,
        context_note=req.context_note,
    )
    db.add(exposure)
    db.commit()
    db.refresh(exposure)
    return exposure


@router.put("/{exposure_id}", response_model=ExposureOut)
def update_exposure(
    journey_id: str,
    exposure_id: str,
    req: UpdateExposureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_access(journey_id, current_user.id, db, require_owner=True)

    exposure = db.query(ExposureInstance).filter(
        ExposureInstance.id == exposure_id,
        ExposureInstance.journey_id == journey_id,
    ).first()
    if not exposure:
        raise HTTPException(status_code=404, detail="Exposure not found")

    if req.description is not None:
        exposure.description = req.description
    if req.context_note is not None:
        exposure.context_note = req.context_note

    db.commit()
    db.refresh(exposure)
    return exposure


@router.delete("/{exposure_id}")
def delete_exposure(
    journey_id: str,
    exposure_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_access(journey_id, current_user.id, db, require_owner=True)

    exposure = db.query(ExposureInstance).filter(
        ExposureInstance.id == exposure_id,
        ExposureInstance.journey_id == journey_id,
    ).first()
    if not exposure:
        raise HTTPException(status_code=404, detail="Exposure not found")

    db.delete(exposure)
    db.commit()
    return {"success": True}
