# FastAPI skill — Veervrat backend

## Project layout reminder
- Routers: `backend/app/routers/[domain].py`
- Models (SQLAlchemy): `backend/app/models/models.py` — ALL in one file
- Schemas (Pydantic): `backend/app/schemas/schemas.py` — ALL in one file
- Auth deps: `backend/app/auth/dependencies.py`
- Config: `backend/app/config.py` (pydantic-settings)
- DB session: `backend/app/database.py`

## Router pattern — match existing routers
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models.models import User, Journey
from ..schemas.schemas import JourneyCreate, JourneyResponse, JourneyUpdate

router = APIRouter(prefix="/journeys", tags=["journeys"])

@router.get("/", response_model=list[JourneyResponse])
def get_journeys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Journey).filter(Journey.user_id == current_user.id).all()

@router.post("/", response_model=JourneyResponse, status_code=status.HTTP_201_CREATED)
def create_journey(
    payload: JourneyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    journey = Journey(**payload.model_dump(), user_id=current_user.id)
    db.add(journey)
    db.commit()
    db.refresh(journey)
    return journey
```

## Schema pattern (Pydantic v2) — add to schemas/schemas.py
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class JourneyBase(BaseModel):
    title: str
    description: Optional[str] = None

class JourneyCreate(JourneyBase):
    pass  # fields for POST body

class JourneyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None  # all fields optional for PATCH

class JourneyResponse(JourneyBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}  # Pydantic v2 ORM mode
```

## SQLAlchemy model pattern — add to models/models.py
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Journey(Base):
    __tablename__ = "journeys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="journeys")
```

## Auth dependency usage
```python
# Protected route — always include this
current_user: User = Depends(get_current_user)

# Optional auth (public + authenticated views)
current_user: Optional[User] = Depends(get_optional_user)
```

## Error handling
```python
# Standard HTTP errors
raise HTTPException(status_code=400, detail="Invalid input")
raise HTTPException(status_code=401, detail="Not authenticated")
raise HTTPException(status_code=403, detail="Not authorized")
raise HTTPException(status_code=404, detail="Journey not found")
# 422 is automatic from Pydantic validation — don't handle manually

# Always check ownership before returning/modifying
journey = db.query(Journey).filter(Journey.id == journey_id).first()
if not journey:
    raise HTTPException(status_code=404, detail="Journey not found")
if journey.user_id != current_user.id:
    raise HTTPException(status_code=403, detail="Not authorized")
```

## Config access
```python
from ..config import settings

# Use settings.database_url, settings.secret_key etc.
# NEVER use os.getenv() directly
```

## Alembic migration (after model changes)
```bash
cd backend
alembic revision --autogenerate -m "add journeys table"
alembic upgrade head
```

## Running the backend
```bash
cd backend
# Check Makefile for exact commands — use make dev or:
uvicorn app.main:app --reload --port 8000
```
