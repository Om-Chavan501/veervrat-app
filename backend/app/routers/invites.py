import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User, UserInvite
from ..schemas.schemas import InviteOut, InviteValidateOut, InviteJoinedItem
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/invites", tags=["invites"])


def _generate_code(db: Session, length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    for _ in range(10):
        code = "".join(random.choices(chars, k=length))
        if not db.query(UserInvite).filter(UserInvite.code == code).first():
            return code
    raise RuntimeError("Failed to generate unique invite code")


@router.get("/mine", response_model=InviteOut)
def get_my_invite(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invite = db.query(UserInvite).filter(UserInvite.user_id == current_user.id).first()
    if not invite:
        invite = UserInvite(
            user_id=current_user.id,
            code=_generate_code(db),
        )
        db.add(invite)
        db.commit()
        db.refresh(invite)
    return invite


@router.get("/validate/{code}", response_model=InviteValidateOut)
def validate_invite(code: str, db: Session = Depends(get_db)):
    invite = db.query(UserInvite).filter(UserInvite.code == code).first()
    if not invite or not invite.user:
        raise HTTPException(status_code=404, detail="Invite code not found")
    return InviteValidateOut(inviter_name=invite.user.name)


@router.get("/joined", response_model=list[InviteJoinedItem])
def get_joined(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .filter(User.invited_by == current_user.id)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )
    return [InviteJoinedItem(name=u.name, joined_at=u.created_at) for u in users]
