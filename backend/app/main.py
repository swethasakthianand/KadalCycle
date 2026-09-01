from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .core.config import settings
from .core.database import init_local_db
from .api import ai_classifier, qr_service, pickups, complaints, analytics

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="KadalCycle API - Multilingual Coastal Fish & Plastic Waste Traceability Platform"
)

# Enable CORS for Vite frontend (localhost:5173) and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for static images
uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Explicit prefix fallback to guarantee /api/v1 endpoints resolve properly
api_prefix = getattr(settings, "API_V1_STR", "/api/v1")

# Include API routers
app.include_router(ai_classifier.router, prefix=api_prefix)
app.include_router(qr_service.router, prefix=api_prefix)
app.include_router(pickups.router, prefix=api_prefix)
app.include_router(complaints.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)

@app.on_event("startup")
async def startup_event():
    init_local_db()

@app.get("/")
async def root():
    return {
        "platform": "KadalCycle (கடல் சுழற்சி)",
        "tagline": "Traceable Coastal Fish & Marine Plastic Waste Valorization Platform",
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}