from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models.models import User, LacunaShortlistSession, LacunaShortlistItem, Lacuna
from ..schemas.schemas import ShortlistSessionOut, ShortlistSessionCreate, AddToShortlistRequest
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/shortlists", tags=["shortlists"])


@router.get("", response_model=List[ShortlistSessionOut])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(LacunaShortlistSession)
        .options(joinedload(LacunaShortlistSession.items).joinedload(LacunaShortlistItem.lacuna))
        .filter(LacunaShortlistSession.user_id == current_user.id)
        .order_by(LacunaShortlistSession.created_at.desc())
        .all()
    )


@router.post("", response_model=ShortlistSessionOut)
def create_session(
    req: ShortlistSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = LacunaShortlistSession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        note=req.note,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=ShortlistSessionOut)
def get_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = (
        db.query(LacunaShortlistSession)
        .options(joinedload(LacunaShortlistSession.items).joinedload(LacunaShortlistItem.lacuna))
        .filter(LacunaShortlistSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return session


@router.post("/{session_id}/items", response_model=ShortlistSessionOut)
def add_item(
    session_id: str,
    req: AddToShortlistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(LacunaShortlistSession).filter(LacunaShortlistSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Check if already exists
    existing = db.query(LacunaShortlistItem).filter(
        LacunaShortlistItem.session_id == session_id,
        LacunaShortlistItem.lacuna_id == req.lacuna_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Lacuna already in shortlist")

    # Get max rank
    max_item = (
        db.query(LacunaShortlistItem)
        .filter(LacunaShortlistItem.session_id == session_id)
        .order_by(LacunaShortlistItem.rank.desc())
        .first()
    )
    new_rank = (max_item.rank + 1) if max_item else 1

    item = LacunaShortlistItem(
        id=str(uuid.uuid4()),
        session_id=session_id,
        lacuna_id=req.lacuna_id,
        rank=new_rank,
    )
    db.add(item)
    db.commit()

    return get_session(session_id, db, current_user)


@router.delete("/{session_id}/items/{lacuna_id}", response_model=ShortlistSessionOut)
def remove_item(
    session_id: str,
    lacuna_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(LacunaShortlistSession).filter(LacunaShortlistSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    item = db.query(LacunaShortlistItem).filter(
        LacunaShortlistItem.session_id == session_id,
        LacunaShortlistItem.lacuna_id == lacuna_id,
    ).first()
    if item:
        db.delete(item)
        db.commit()

    return get_session(session_id, db, current_user)
