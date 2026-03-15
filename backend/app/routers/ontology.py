from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models.models import Lacuna, Virtue, SubVirtue, Sentence
from ..schemas.schemas import LacunaOut, LacunaDetailOut, VirtueOut, SubVirtueOut, SentenceOut
from ..auth.dependencies import get_current_user
from ..models.models import User

router = APIRouter(prefix="/ontology", tags=["ontology"])


@router.get("/lacunae", response_model=List[LacunaOut])
def list_lacunae(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Lacuna).order_by(Lacuna.category, Lacuna.name_en).all()


@router.get("/lacunae/{lacuna_id}", response_model=LacunaDetailOut)
def get_lacuna(lacuna_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from fastapi import HTTPException
    lacuna = (
        db.query(Lacuna)
        .options(
            joinedload(Lacuna.lacuna_sub_virtues).joinedload("sub_virtue").joinedload("virtue")
        )
        .filter(Lacuna.id == lacuna_id)
        .first()
    )
    if not lacuna:
        raise HTTPException(status_code=404, detail="Lacuna not found")
    return lacuna


@router.get("/virtues", response_model=List[VirtueOut])
def list_virtues(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Virtue).order_by(Virtue.name_en).all()


@router.get("/virtues/{virtue_id}/sub-virtues", response_model=List[SubVirtueOut])
def list_sub_virtues(virtue_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(SubVirtue).filter(SubVirtue.virtue_id == virtue_id).all()


@router.get("/sentences", response_model=List[SentenceOut])
def list_sentences(
    sub_virtue_id: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    q = db.query(Sentence).options(joinedload(Sentence.sub_virtue).joinedload(SubVirtue.virtue))
    if sub_virtue_id:
        q = q.filter(Sentence.sub_virtue_id == sub_virtue_id)
    return q.all()
