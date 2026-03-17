from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models.models import (
    User, LacunaAssessment, AssessmentResponse, SuggestedSentenceSnapshot,
    AssessmentStatus, Rating, Lacuna, LacunaSubVirtue, Sentence, SubVirtue
)
from ..schemas.schemas import (
    AssessmentOut, AssessmentDetailOut, SaveResponseRequest,
    StartAssessmentRequest, SuggestedSnapshotOut
)
from ..auth.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("", response_model=List[AssessmentOut])
def list_assessments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(LacunaAssessment)
        .options(joinedload(LacunaAssessment.lacuna))
        .filter(LacunaAssessment.user_id == current_user.id)
        .order_by(LacunaAssessment.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/start", response_model=AssessmentDetailOut)
def start_assessment(
    req: StartAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Return existing IN_PROGRESS assessment if one exists
    existing = db.query(LacunaAssessment).filter(
        LacunaAssessment.user_id == current_user.id,
        LacunaAssessment.lacuna_id == req.lacuna_id,
        LacunaAssessment.status == AssessmentStatus.IN_PROGRESS,
    ).first()

    if existing:
        return get_assessment(existing.id, db, current_user)

    assessment = LacunaAssessment(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        lacuna_id=req.lacuna_id,
        status=AssessmentStatus.IN_PROGRESS,
        shortlist_session_id=req.shortlist_session_id,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return get_assessment(assessment.id, db, current_user)


@router.get("/{assessment_id}", response_model=AssessmentDetailOut)
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(LacunaAssessment)
        .options(
            joinedload(LacunaAssessment.lacuna).joinedload(Lacuna.lacuna_sub_virtues)
            .joinedload(LacunaSubVirtue.sub_virtue).joinedload(SubVirtue.sentences),
            joinedload(LacunaAssessment.lacuna).joinedload(Lacuna.lacuna_sub_virtues)
            .joinedload(LacunaSubVirtue.sub_virtue).joinedload(SubVirtue.virtue),
            joinedload(LacunaAssessment.responses).joinedload(AssessmentResponse.sentence)
            .joinedload(Sentence.sub_virtue).joinedload(SubVirtue.virtue),
            joinedload(LacunaAssessment.suggestions).joinedload(SuggestedSentenceSnapshot.sentence)
            .joinedload(Sentence.sub_virtue).joinedload(SubVirtue.virtue),
        )
        .filter(LacunaAssessment.id == assessment_id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return assessment


@router.post("/{assessment_id}/responses")
def save_response(
    assessment_id: str,
    req: SaveResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.query(LacunaAssessment).filter(LacunaAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if assessment.status != AssessmentStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Cannot modify a completed assessment")

    existing = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id,
        AssessmentResponse.sentence_id == req.sentence_id,
    ).first()

    from datetime import datetime
    if existing:
        existing.rating = req.rating
        existing.answered_at = datetime.utcnow()
    else:
        existing = AssessmentResponse(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            sentence_id=req.sentence_id,
            rating=req.rating,
        )
        db.add(existing)

    db.commit()
    return {"success": True}


@router.delete("/{assessment_id}/responses/{sentence_id}")
def delete_response(
    assessment_id: str,
    sentence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.query(LacunaAssessment).filter(LacunaAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if assessment.status != AssessmentStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Cannot modify a completed assessment")

    response = db.query(AssessmentResponse).filter(
        AssessmentResponse.assessment_id == assessment_id,
        AssessmentResponse.sentence_id == sentence_id,
    ).first()

    if response:
        db.delete(response)
        db.commit()

    return {"success": True}


@router.post("/{assessment_id}/complete", response_model=AssessmentDetailOut)
def complete_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.query(LacunaAssessment).filter(LacunaAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if assessment.status != AssessmentStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Assessment already completed")

    from datetime import datetime
    assessment.status = AssessmentStatus.COMPLETED
    assessment.completed_at = datetime.utcnow()
    db.commit()

    _generate_suggestions(db, assessment_id, assessment.lacuna_id)

    return get_assessment(assessment_id, db, current_user)


@router.get("/{assessment_id}/suggestions", response_model=List[SuggestedSnapshotOut])
def get_suggestions(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.query(LacunaAssessment).filter(LacunaAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return (
        db.query(SuggestedSentenceSnapshot)
        .options(
            joinedload(SuggestedSentenceSnapshot.sentence)
            .joinedload(Sentence.sub_virtue)
            .joinedload(SubVirtue.virtue)
        )
        .filter(SuggestedSentenceSnapshot.assessment_id == assessment_id)
        .order_by(SuggestedSentenceSnapshot.priority_rank)
        .all()
    )


def _generate_suggestions(db: Session, assessment_id: str, lacuna_id: str):
    low_responses = (
        db.query(AssessmentResponse)
        .options(joinedload(AssessmentResponse.sentence).joinedload(Sentence.sub_virtue))
        .filter(
            AssessmentResponse.assessment_id == assessment_id,
            AssessmentResponse.rating.in_([Rating.RARELY, Rating.NEVER]),
        )
        .all()
    )

    lsv_list = db.query(LacunaSubVirtue).filter(LacunaSubVirtue.lacuna_id == lacuna_id).all()
    priority_map = {lsv.sub_virtue_id: lsv.priority for lsv in lsv_list}

    sorted_responses = sorted(
        low_responses,
        key=lambda r: priority_map.get(r.sentence.sub_virtue_id, 999),
    )

    db.query(SuggestedSentenceSnapshot).filter(
        SuggestedSentenceSnapshot.assessment_id == assessment_id
    ).delete()
    db.flush()

    for i, response in enumerate(sorted_responses):
        snap = SuggestedSentenceSnapshot(
            id=str(uuid.uuid4()),
            assessment_id=assessment_id,
            sentence_id=response.sentence_id,
            priority_rank=i + 1,
            reason=f"Rated {response.rating.value} — needs cultivation of {response.sentence.sub_virtue.name_en}",
        )
        db.add(snap)

    db.commit()
