import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Text, ForeignKey,
    Enum as SAEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from ..database import Base


def gen_uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────

class JourneyState(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    COMPLETED = "COMPLETED"


class AssessmentStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Rating(str, enum.Enum):
    ALWAYS = "ALWAYS"
    OFTEN = "OFTEN"
    RARELY = "RARELY"
    NEVER = "NEVER"


class IrrationalBelief(str, enum.Enum):
    MUST_BE_LOVED = "MUST_BE_LOVED"
    MUST_BE_COMPETENT = "MUST_BE_COMPETENT"
    MUST_HAVE_COMFORT = "MUST_HAVE_COMFORT"


class LacunaCategory(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class VratmitraStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    DETACHED = "DETACHED"


# ─────────────────────────────────────────
# CORE USER & ROLES
# ─────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    invited_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    admin_role = relationship("AdminRole", back_populates="user", uselist=False)
    shortlist_sessions = relationship("LacunaShortlistSession", back_populates="user")
    assessments = relationship("LacunaAssessment", back_populates="user")
    journeys = relationship("SentenceJourney", back_populates="user")
    vratmitra_links = relationship("JourneyVratmitra", back_populates="user")
    reflection_comments = relationship("ReflectionComment", back_populates="user")
    invite = relationship("UserInvite", back_populates="user", uselist=False)
    global_vratmitra_sent = relationship("UserVratmitra", foreign_keys="UserVratmitra.user_id", back_populates="user", uselist=False)
    global_vratmitra_received = relationship("UserVratmitra", foreign_keys="UserVratmitra.vratmitra_id", back_populates="vratmitra")


class UserInvite(Base):
    __tablename__ = "user_invites"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False, index=True)
    uses_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="invite")


class AdminRole(Base):
    __tablename__ = "admin_roles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    granted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="admin_role")


# ─────────────────────────────────────────
# ONTOLOGY (STATIC)
# ─────────────────────────────────────────

class Lacuna(Base):
    __tablename__ = "lacunae"

    id = Column(String, primary_key=True, default=gen_uuid)
    name_en = Column(String, unique=True, nullable=False)
    name_mr = Column(String, nullable=False)
    category = Column(SAEnum(LacunaCategory), nullable=False)

    # Relationships
    assessments = relationship("LacunaAssessment", back_populates="lacuna")
    shortlist_items = relationship("LacunaShortlistItem", back_populates="lacuna")
    lacuna_sub_virtues = relationship("LacunaSubVirtue", back_populates="lacuna")

    __table_args__ = (Index("ix_lacunae_category", "category"),)


class Virtue(Base):
    __tablename__ = "virtues"

    id = Column(String, primary_key=True, default=gen_uuid)
    name_en = Column(String, unique=True, nullable=False)
    name_mr = Column(String, nullable=False)

    sub_virtues = relationship("SubVirtue", back_populates="virtue")


class SubVirtue(Base):
    __tablename__ = "sub_virtues"

    id = Column(String, primary_key=True, default=gen_uuid)
    name_en = Column(String, unique=True, nullable=False)
    name_mr = Column(String, nullable=False)
    virtue_id = Column(String, ForeignKey("virtues.id"), nullable=False)

    virtue = relationship("Virtue", back_populates="sub_virtues")
    sentences = relationship("Sentence", back_populates="sub_virtue")
    lacuna_sub_virtues = relationship("LacunaSubVirtue", back_populates="sub_virtue")


class LacunaSubVirtue(Base):
    __tablename__ = "lacuna_sub_virtues"

    id = Column(String, primary_key=True, default=gen_uuid)
    lacuna_id = Column(String, ForeignKey("lacunae.id"), nullable=False)
    sub_virtue_id = Column(String, ForeignKey("sub_virtues.id"), nullable=False)
    priority = Column(Integer, nullable=False)

    lacuna = relationship("Lacuna", back_populates="lacuna_sub_virtues")
    sub_virtue = relationship("SubVirtue", back_populates="lacuna_sub_virtues")

    __table_args__ = (UniqueConstraint("lacuna_id", "sub_virtue_id"),)


class Sentence(Base):
    __tablename__ = "sentences"

    id = Column(String, primary_key=True, default=gen_uuid)
    text_en = Column(String, unique=True, nullable=False)
    text_mr = Column(String, nullable=False)
    sub_virtue_id = Column(String, ForeignKey("sub_virtues.id"), nullable=False)

    sub_virtue = relationship("SubVirtue", back_populates="sentences")
    assessment_responses = relationship("AssessmentResponse", back_populates="sentence")
    suggested_snapshots = relationship("SuggestedSentenceSnapshot", back_populates="sentence")
    journeys = relationship("SentenceJourney", back_populates="sentence")


# ─────────────────────────────────────────
# LACUNA SHORTLISTING
# ─────────────────────────────────────────

class LacunaShortlistSession(Base):
    __tablename__ = "lacuna_shortlist_sessions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="shortlist_sessions")
    items = relationship("LacunaShortlistItem", back_populates="session")
    lacuna_assessments = relationship("LacunaAssessment", back_populates="shortlist_session")


class LacunaShortlistItem(Base):
    __tablename__ = "lacuna_shortlist_items"

    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("lacuna_shortlist_sessions.id"), nullable=False)
    lacuna_id = Column(String, ForeignKey("lacunae.id"), nullable=False)
    rank = Column(Integer, nullable=False)

    session = relationship("LacunaShortlistSession", back_populates="items")
    lacuna = relationship("Lacuna", back_populates="shortlist_items")

    __table_args__ = (UniqueConstraint("session_id", "lacuna_id"),)


# ─────────────────────────────────────────
# LACUNA ASSESSMENTS
# ─────────────────────────────────────────

class LacunaAssessment(Base):
    __tablename__ = "lacuna_assessments"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    lacuna_id = Column(String, ForeignKey("lacunae.id"), nullable=False)
    status = Column(SAEnum(AssessmentStatus), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    shortlist_session_id = Column(String, ForeignKey("lacuna_shortlist_sessions.id"), nullable=True)

    user = relationship("User", back_populates="assessments")
    lacuna = relationship("Lacuna", back_populates="assessments")
    shortlist_session = relationship("LacunaShortlistSession", back_populates="lacuna_assessments")
    responses = relationship("AssessmentResponse", back_populates="assessment")
    suggestions = relationship("SuggestedSentenceSnapshot", back_populates="assessment")
    links = relationship("SentenceJourneyAssessmentLink", back_populates="assessment")


class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"

    id = Column(String, primary_key=True, default=gen_uuid)
    assessment_id = Column(String, ForeignKey("lacuna_assessments.id"), nullable=False)
    sentence_id = Column(String, ForeignKey("sentences.id"), nullable=False)
    rating = Column(SAEnum(Rating), nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("LacunaAssessment", back_populates="responses")
    sentence = relationship("Sentence", back_populates="assessment_responses")

    __table_args__ = (UniqueConstraint("assessment_id", "sentence_id"),)


class SuggestedSentenceSnapshot(Base):
    __tablename__ = "suggested_sentence_snapshots"

    id = Column(String, primary_key=True, default=gen_uuid)
    assessment_id = Column(String, ForeignKey("lacuna_assessments.id"), nullable=False)
    sentence_id = Column(String, ForeignKey("sentences.id"), nullable=False)
    priority_rank = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)

    assessment = relationship("LacunaAssessment", back_populates="suggestions")
    sentence = relationship("Sentence", back_populates="suggested_snapshots")

    __table_args__ = (UniqueConstraint("assessment_id", "sentence_id"),)


# ─────────────────────────────────────────
# SENTENCE JOURNEY (CORE)
# ─────────────────────────────────────────

class SentenceJourney(Base):
    __tablename__ = "sentence_journeys"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    sentence_id = Column(String, ForeignKey("sentences.id"), nullable=False)
    state = Column(SAEnum(JourneyState), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    inactive_at = Column(DateTime, nullable=True)
    inactive_reason = Column(Text, nullable=True)

    user = relationship("User", back_populates="journeys")
    sentence = relationship("Sentence", back_populates="journeys")
    links = relationship("SentenceJourneyAssessmentLink", back_populates="journey")
    resolutions = relationship("ResolutionInstance", back_populates="journey")
    reflections = relationship("DailyReflection", back_populates="journey")
    exposures = relationship("ExposureInstance", back_populates="journey")
    vratmitras = relationship("JourneyVratmitra", back_populates="journey")

    __table_args__ = (UniqueConstraint("user_id", "sentence_id"),)


class SentenceJourneyAssessmentLink(Base):
    __tablename__ = "sentence_journey_assessment_links"

    id = Column(String, primary_key=True, default=gen_uuid)
    journey_id = Column(String, ForeignKey("sentence_journeys.id"), nullable=False)
    assessment_id = Column(String, ForeignKey("lacuna_assessments.id"), nullable=False)
    virtue_relation_note = Column(Text, nullable=True)
    lacuna_reduction_note = Column(Text, nullable=False)
    unified_insight_note = Column(Text, nullable=False)
    personal_context_note = Column(Text, nullable=False)
    irrational_belief = Column(SAEnum(IrrationalBelief), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    journey = relationship("SentenceJourney", back_populates="links")
    assessment = relationship("LacunaAssessment", back_populates="links")

    __table_args__ = (UniqueConstraint("journey_id", "assessment_id"),)


# ─────────────────────────────────────────
# VRATMITRA ATTACHMENT
# ─────────────────────────────────────────

class UserVratmitra(Base):
    """Global Vratmitra relationship — one trusted mentor across all journeys."""
    __tablename__ = "user_vratmitras"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)       # inviter
    vratmitra_id = Column(String, ForeignKey("users.id"), nullable=False)  # invitee
    status = Column(SAEnum(VratmitraStatus), nullable=False, default=VratmitraStatus.PENDING)
    invited_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    detached_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="global_vratmitra_sent")
    vratmitra = relationship("User", foreign_keys=[vratmitra_id], back_populates="global_vratmitra_received")

    __table_args__ = (UniqueConstraint("user_id"),)


class JourneyVratmitra(Base):
    __tablename__ = "journey_vratmitras"

    id = Column(String, primary_key=True, default=gen_uuid)
    journey_id = Column(String, ForeignKey("sentence_journeys.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(SAEnum(VratmitraStatus), nullable=False, default=VratmitraStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    detached_at = Column(DateTime, nullable=True)

    journey = relationship("SentenceJourney", back_populates="vratmitras")
    user = relationship("User", back_populates="vratmitra_links")

    __table_args__ = (UniqueConstraint("journey_id", "user_id"),)


# ─────────────────────────────────────────
# EXPOSURES
# ─────────────────────────────────────────

class ExposureInstance(Base):
    __tablename__ = "exposure_instances"

    id = Column(String, primary_key=True, default=gen_uuid)
    journey_id = Column(String, ForeignKey("sentence_journeys.id"), nullable=False)
    description = Column(Text, nullable=False)
    context_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    journey = relationship("SentenceJourney", back_populates="exposures")


# ─────────────────────────────────────────
# RESOLUTIONS
# ─────────────────────────────────────────

class ResolutionInstance(Base):
    __tablename__ = "resolution_instances"

    id = Column(String, primary_key=True, default=gen_uuid)
    journey_id = Column(String, ForeignKey("sentence_journeys.id"), nullable=False)
    text = Column(Text, nullable=False)
    frequency = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    journey = relationship("SentenceJourney", back_populates="resolutions")


# ─────────────────────────────────────────
# DAILY REFLECTIONS
# ─────────────────────────────────────────

class DailyReflection(Base):
    __tablename__ = "daily_reflections"

    id = Column(String, primary_key=True, default=gen_uuid)
    journey_id = Column(String, ForeignKey("sentence_journeys.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    applied = Column(Boolean, nullable=False)
    context_note = Column(Text, nullable=True)
    insight_note = Column(Text, nullable=True)
    difficulty = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    journey = relationship("SentenceJourney", back_populates="reflections")
    comments = relationship("ReflectionComment", back_populates="reflection")

    __table_args__ = (UniqueConstraint("journey_id", "date"),)


class ReflectionComment(Base):
    __tablename__ = "reflection_comments"

    id = Column(String, primary_key=True, default=gen_uuid)
    reflection_id = Column(String, ForeignKey("daily_reflections.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    reflection = relationship("DailyReflection", back_populates="comments")
    user = relationship("User", back_populates="reflection_comments")

    __table_args__ = (Index("ix_reflection_comments_reflection_id", "reflection_id"),)
