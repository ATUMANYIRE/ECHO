"""Main FastAPI application entry point for ECHO."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes import api_router
from app.api.health import router as root_health_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("echo.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle hooks."""
    logger.info("Starting %s v%s in %s mode", settings.app_name, settings.app_version, settings.environment)
    logger.info("CORS origins configured: %s", settings.cors_origins)
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="ECHO: Educational Debugging Laboratory — Execution-first root cause analysis.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.cors_origins if isinstance(settings.cors_origins, list) else [settings.cors_origins]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes (/api/health, /api/execution/run)
app.include_router(api_router)

# Also expose /health at root for health-checks
app.include_router(root_health_router)


@app.get("/", tags=["Root"])
async def root():
    """Root info endpoint."""
    return JSONResponse(
        content={
            "app": settings.app_name,
            "version": settings.app_version,
            "milestone": "Milestone 4 & Milestone 5: Final Competition Release & Evidence-Grounded Gemini AI Investigator",
            "tagline": "Don't just fix the mistake. Understand the moment it was made.",
            "health_endpoint": "/api/health",
            "documentation": "/docs",
        }
    )
