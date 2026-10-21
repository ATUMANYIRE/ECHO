"""Aggregated API router configuration."""

from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.execution import router as execution_router
from app.api.investigation import router as investigation_router

api_router = APIRouter(prefix="/api")

# Register sub-routers
api_router.include_router(health_router)
api_router.include_router(execution_router)
api_router.include_router(investigation_router)
