from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict
from datetime import datetime
from ..models.models import (
    JourneyState, AssessmentStatus, Rating, IrrationalBelief,
    LacunaCategory, VratmitraStatus
)


# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RefreshRequest(BaseModel):
    refresh_token: str


# ─────────────────────────────────────────
# USER
# ─────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None


# ─────────────────────────────────────────
# ONTOLOGY
# ─────────────────────────────────────────

class VirtueOut(BaseModel):
    id: str
    name_en: str
    name_mr: str

    class Config:
        from_attributes = True


class SentenceOut(BaseModel):
    """Sentence without sub_virtue back-reference — safe to nest inside SubVirtueOut."""
    id: str
    text_en: str
    text_mr: str
    sub_virtue_id: str

    class Config:
        from_attributes = True


class SubVirtueOut(BaseModel):
    id: str
    name_en: str
    name_mr: str
    virtue_id: str
    virtue: Optional[VirtueOut] = None
    sentences: List[SentenceOut] = []

    class Config:
        from_attributes = True


class SentenceDetailOut(BaseModel):
    """Sentence with full sub_virtue context — for standalone use (journeys, suggestions, responses)."""
    id: str
    text_en: str
    text_mr: str
    sub_virtue_id: str
    sub_virtue: Optional[SubVirtueOut] = None

    class Config:
        from_attributes = True


class LacunaOut(BaseModel):
    id: str
    name_en: str
    name_mr: str
    category: LacunaCategory

    class Config:
        from_attributes = True


class LacunaSubVirtueOut(BaseModel):
    id: str
    lacuna_id: str
    sub_virtue_id: str
    priority: int
    sub_virtue: Optional[SubVirtueOut] = None

    class Config:
        from_attributes = True


class LacunaDetailOut(BaseModel):
    id: str
    name_en: str
    name_mr: str
    category: LacunaCategory
    lacuna_sub_virtues: List[LacunaSubVirtueOut] = []

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# SHORTLIST
# ─────────────────────────────────────────

class ShortlistItemOut(BaseModel):
    id: str
    session_id: str
    lacuna_id: str
    rank: int
    lacuna: Optional[LacunaOut] = None

    class Config:
        from_attributes = True


class ShortlistSessionOut(BaseModel):
    id: str
    user_id: str
    note: Optional[str] = None
    created_at: datetime
    items: List[ShortlistItemOut] = []

    class Config:
        from_attributes = True


class ShortlistSessionCreate(BaseModel):
    note: Optional[str] = None


class AddToShortlistRequest(BaseModel):
    lacuna_id: str


class BatchUpdateShortlistRequest(BaseModel):
    """Replace shortlist items with exactly this ordered list of lacuna IDs."""
    lacuna_ids: List[str]


# ─────────────────────────────────────────
# ASSESSMENTS
# ─────────────────────────────────────────

class AssessmentResponseOut(BaseModel):
    id: str
    assessment_id: str
    sentence_id: str
    rating: Rating
    answered_at: datetime
    sentence: Optional[SentenceDetailOut] = None

    class Config:
        from_attributes = True


class SuggestedSnapshotOut(BaseModel):
    id: str
    assessment_id: str
    sentence_id: str
    priority_rank: int
    reason: str
    sentence: Optional[SentenceDetailOut] = None

    class Config:
        from_attributes = True


class AssessmentOut(BaseModel):
    id: str
    user_id: str
    lacuna_id: str
    status: AssessmentStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    shortlist_session_id: Optional[str] = None
    lacuna: Optional[LacunaOut] = None

    class Config:
        from_attributes = True


class AssessmentDetailOut(BaseModel):
    id: str
    user_id: str
    lacuna_id: str
    status: AssessmentStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    shortlist_session_id: Optional[str] = None
    lacuna: Optional[LacunaDetailOut] = None
    responses: List[AssessmentResponseOut] = []
    suggestions: List[SuggestedSnapshotOut] = []

    class Config:
        from_attributes = True


class SaveResponseRequest(BaseModel):
    sentence_id: str
    rating: Rating


class StartAssessmentRequest(BaseModel):
    lacuna_id: str
    shortlist_session_id: Optional[str] = None


# ─────────────────────────────────────────
# JOURNEYS
# ─────────────────────────────────────────

class ResolutionOut(BaseModel):
    id: str
    journey_id: str
    text: str
    frequency: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClarificationLinkOut(BaseModel):
    id: str
    journey_id: str
    assessment_id: str
    virtue_relation_note: Optional[str] = None
    lacuna_reduction_note: str
    unified_insight_note: str
    personal_context_note: str
    irrational_belief: IrrationalBelief
    created_at: datetime
    assessment: Optional[AssessmentOut] = None

    class Config:
        from_attributes = True


class JourneyOut(BaseModel):
    id: str
    user_id: str
    sentence_id: str
    state: JourneyState
    created_at: datetime
    inactive_at: Optional[datetime] = None
    inactive_reason: Optional[str] = None
    sentence: Optional[SentenceDetailOut] = None

    class Config:
        from_attributes = True


class JourneyDetailOut(BaseModel):
    id: str
    user_id: str
    sentence_id: str
    state: JourneyState
    created_at: datetime
    inactive_at: Optional[datetime] = None
    inactive_reason: Optional[str] = None
    sentence: Optional[SentenceDetailOut] = None
    links: List[ClarificationLinkOut] = []
    resolutions: List[ResolutionOut] = []

    class Config:
        from_attributes = True


class JourneyCountsOut(BaseModel):
    ACTIVE: int = 0
    INACTIVE: int = 0
    COMPLETED: int = 0


class CreateJourneyRequest(BaseModel):
    sentence_id: str
    assessment_id: str


class SaveClarificationRequest(BaseModel):
    virtue_relation_note: Optional[str] = None
    lacuna_reduction_note: str
    unified_insight_note: str
    personal_context_note: str
    irrational_belief: IrrationalBelief


class AddResolutionRequest(BaseModel):
    text: str
    frequency: str


class UpdateResolutionRequest(BaseModel):
    text: str
    frequency: str


class PauseJourneyRequest(BaseModel):
    reason: Optional[str] = None


# ─────────────────────────────────────────
# REFLECTIONS
# ─────────────────────────────────────────

class ReflectionCommentOut(BaseModel):
    id: str
    reflection_id: str
    user_id: str
    text: str
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


class ReflectionOut(BaseModel):
    id: str
    journey_id: str
    date: datetime
    applied: bool
    context_note: Optional[str] = None
    insight_note: Optional[str] = None
    difficulty: Optional[int] = None
    created_at: datetime
    comments: List[ReflectionCommentOut] = []

    class Config:
        from_attributes = True


class CreateReflectionRequest(BaseModel):
    applied: bool
    context_note: str
    insight_note: str
    difficulty: Optional[int] = None


class UpdateReflectionRequest(BaseModel):
    applied: Optional[bool] = None
    context_note: Optional[str] = None
    insight_note: Optional[str] = None
    difficulty: Optional[int] = None


class AddCommentRequest(BaseModel):
    text: str


# ─────────────────────────────────────────
# EXPOSURES
# ─────────────────────────────────────────

class ExposureOut(BaseModel):
    id: str
    journey_id: str
    description: str
    context_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CreateExposureRequest(BaseModel):
    description: str
    context_note: Optional[str] = None


class UpdateExposureRequest(BaseModel):
    description: Optional[str] = None
    context_note: Optional[str] = None


# ─────────────────────────────────────────
# VRATMITRA
# ─────────────────────────────────────────

class VratmitraOut(BaseModel):
    id: str
    journey_id: str
    user_id: str
    status: VratmitraStatus
    created_at: datetime
    accepted_at: Optional[datetime] = None
    detached_at: Optional[datetime] = None
    user: Optional[UserOut] = None
    journey: Optional[JourneyOut] = None

    class Config:
        from_attributes = True


class InviteVratmitraRequest(BaseModel):
    invitee_email: EmailStr


# ─────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────

class DashboardStats(BaseModel):
    active_journeys: int
    total_reflections: int
    pending_invitations: int
    completed_journeys: int


TokenResponse.model_rebuild()
