from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base
from .routers import auth, users, ontology, assessments, shortlists, journeys, reflections, exposures, vratmitra

settings = get_settings()

# Create all tables (use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Veervrat API",
    description="Character development and inner transformation platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(ontology.router, prefix="/api/v1")
app.include_router(assessments.router, prefix="/api/v1")
app.include_router(shortlists.router, prefix="/api/v1")
app.include_router(journeys.router, prefix="/api/v1")
app.include_router(reflections.router, prefix="/api/v1")
app.include_router(exposures.router, prefix="/api/v1")
app.include_router(vratmitra.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
