from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models.models import (
    User, SentenceJourney, JourneyVratmitra, VratmitraStatus,
    Sentence, SubVirtue, Virtue, UserVratmitra
)
from ..schemas.schemas import (
    VratmitraOut, InviteVratmitraRequest,
    GlobalVratmitraInviteRequest, GlobalVratmitraOut,
)
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/vratmitra", tags=["vratmitra"])


@router.get("/pending", response_model=List[VratmitraOut])
def get_pending_invitations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(JourneyVratmitra)
        .options(
            joinedload(JourneyVratmitra.journey)
            .joinedload(SentenceJourney.sentence)
            .joinedload(Sentence.sub_virtue)
            .joinedload(SubVirtue.virtue),
            joinedload(JourneyVratmitra.journey)
            .joinedload(SentenceJourney.user),
            joinedload(JourneyVratmitra.user),
        )
        .filter(
            JourneyVratmitra.user_id == current_user.id,
            JourneyVratmitra.status == VratmitraStatus.PENDING,
        )
        .order_by(JourneyVratmitra.created_at.desc())
        .all()
    )


@router.get("/my-mentored-journeys", response_model=List[VratmitraOut])
def get_mentored_journeys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(JourneyVratmitra)
        .options(
            joinedload(JourneyVratmitra.journey).joinedload(SentenceJourney.sentence),
            joinedload(JourneyVratmitra.user),
        )
        .filter(
            JourneyVratmitra.user_id == current_user.id,
            JourneyVratmitra.status == VratmitraStatus.ACTIVE,
        )
        .all()
    )


@router.post("/journeys/{journey_id}/invite", response_model=VratmitraOut)
def invite_vratmitra(
    journey_id: str,
    req: InviteVratmitraRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    if journey.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only journey owner can invite Vratmitra")

    if req.invitee_id:
        invitee = db.query(User).filter(User.id == req.invitee_id).first()
        if not invitee:
            raise HTTPException(status_code=404, detail="User not found")
    elif req.invitee_email:
        invitee = db.query(User).filter(User.email == req.invitee_email).first()
        if not invitee:
            raise HTTPException(status_code=404, detail="User with this email not found")
    else:
        raise HTTPException(status_code=400, detail="Either invitee_id or invitee_email is required")
    if invitee.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself as Vratmitra")

    # Check for existing active or pending
    existing = db.query(JourneyVratmitra).filter(
        JourneyVratmitra.journey_id == journey_id,
        JourneyVratmitra.user_id == invitee.id,
    ).first()

    if existing:
        if existing.status == VratmitraStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="User is already the active Vratmitra")
        if existing.status == VratmitraStatus.PENDING:
            raise HTTPException(status_code=400, detail="Invitation already pending for this user")
        # If detached, create a new one
        db.delete(existing)
        db.flush()

    # Check if already has active Vratmitra
    active = db.query(JourneyVratmitra).filter(
        JourneyVratmitra.journey_id == journey_id,
        JourneyVratmitra.status == VratmitraStatus.ACTIVE,
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="Journey already has an active Vratmitra")

    invitation = JourneyVratmitra(
        id=str(uuid.uuid4()),
        journey_id=journey_id,
        user_id=invitee.id,
        status=VratmitraStatus.PENDING,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.post("/journeys/{journey_id}/accept", response_model=VratmitraOut)
def accept_invitation(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invitation = db.query(JourneyVratmitra).filter(
        JourneyVratmitra.journey_id == journey_id,
        JourneyVratmitra.user_id == current_user.id,
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="No invitation found for this journey")
    if invitation.status != VratmitraStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot accept invitation with status: {invitation.status}")

    invitation.status = VratmitraStatus.ACTIVE
    invitation.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(invitation)
    return invitation


@router.post("/journeys/{journey_id}/detach", response_model=VratmitraOut)
def detach_vratmitra(
    journey_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    journey = db.query(SentenceJourney).filter(SentenceJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    is_owner = journey.user_id == current_user.id

    attachment = db.query(JourneyVratmitra).filter(
        JourneyVratmitra.journey_id == journey_id,
        JourneyVratmitra.status.in_([VratmitraStatus.ACTIVE, VratmitraStatus.PENDING]),
    ).first()

    if not attachment:
        raise HTTPException(status_code=404, detail="No active Vratmitra attachment found")

    is_vratmitra = attachment.user_id == current_user.id
    if not is_owner and not is_vratmitra:
        raise HTTPException(status_code=403, detail="Unauthorized")

    attachment.status = VratmitraStatus.DETACHED
    attachment.detached_at = datetime.utcnow()
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/journeys/{journey_id}/current", response_model=VratmitraOut | None)
def get_active_vratmitra(
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
        db.query(JourneyVratmitra)
        .options(joinedload(JourneyVratmitra.user))
        .filter(
            JourneyVratmitra.journey_id == journey_id,
            JourneyVratmitra.status == VratmitraStatus.ACTIVE,
        )
        .first()
    )


# ─────────────────────────────────────────
# GLOBAL VRATMITRA
# ─────────────────────────────────────────

@router.post("/global", response_model=GlobalVratmitraOut)
def invite_global_vratmitra(
    req: GlobalVratmitraInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.invitee_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself as Global Vratmitra")

    invitee = db.query(User).filter(User.id == req.invitee_id).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(UserVratmitra).filter(
        UserVratmitra.user_id == current_user.id,
        UserVratmitra.status.in_([VratmitraStatus.PENDING, VratmitraStatus.ACTIVE]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending or active Global Vratmitra")

    record = UserVratmitra(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        vratmitra_id=req.invitee_id,
        status=VratmitraStatus.PENDING,
        invited_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/global", response_model=GlobalVratmitraOut | None)
def get_global_vratmitra(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserVratmitra)
        .options(joinedload(UserVratmitra.vratmitra))
        .filter(
            UserVratmitra.user_id == current_user.id,
            UserVratmitra.status.in_([VratmitraStatus.PENDING, VratmitraStatus.ACTIVE]),
        )
        .first()
    )


@router.get("/global/pending", response_model=List[GlobalVratmitraOut])
def get_global_pending_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserVratmitra)
        .options(joinedload(UserVratmitra.user))
        .filter(
            UserVratmitra.vratmitra_id == current_user.id,
            UserVratmitra.status == VratmitraStatus.PENDING,
        )
        .order_by(UserVratmitra.invited_at.desc())
        .all()
    )


@router.post("/global/accept", response_model=GlobalVratmitraOut)
def accept_global_invitation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(UserVratmitra).filter(
        UserVratmitra.vratmitra_id == current_user.id,
        UserVratmitra.status == VratmitraStatus.PENDING,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No pending Global Vratmitra invitation found")

    record.status = VratmitraStatus.ACTIVE
    record.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


@router.delete("/global", status_code=204)
def remove_global_vratmitra(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(UserVratmitra).filter(
        (UserVratmitra.user_id == current_user.id) | (UserVratmitra.vratmitra_id == current_user.id),
        UserVratmitra.status.in_([VratmitraStatus.PENDING, VratmitraStatus.ACTIVE]),
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No active Global Vratmitra relationship found")

    db.delete(record)
    db.commit()
