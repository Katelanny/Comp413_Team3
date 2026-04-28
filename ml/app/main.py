"""
Main entry point for the FastAPI application.

This module initializes the FastAPI instance, manages the application lifecycle 
via a lifespan context manager, and sets up global state for machine learning models.

Key Responsibilities:
- Lifespan Management: Handles pre-startup logic including downloading model weights 
  from cloud storage (GCS) and instantiating Detectron2 models into the app state.
- Dependency Injection: Models are attached to `app.state` to be accessible across 
  all API requests.
- Routing: Registers the primary API router containing prediction endpoints.
- Configuration: Utilizes global settings for environment-specific paths and metadata.
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel
from app.api.routes import router
from app.config import settings
from download_models import download_model_files

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the startup and shutdown sequence of the FastAPI application.

    Startup: 
    - Downloads model weights from Google Cloud Storage (GCS) via `download_model_files()`.
    - Initializes `LesionModel` and `PoseModel` using environment-specific settings.
    - Stores model instances in `app.state` to avoid re-loading weights on every request.
    """
    # Downloading the weights first
    print("Downloading model files from GCS...")
    download_model_files()
    print("Download complete.")
    # Initialize Lesion Model using settings
    app.state.lesion_model = LesionModel(
        config_path=settings.lesion_config_path,
        weights_path=settings.lesion_weights_path,
    )

    # Initialize Pose Model using settings
    app.state.pose_model = PoseModel(
        config_path=settings.pose_config_path,
        weights_path=settings.pose_weights_path,
    )
    
    print(f"Loaded models using paths from environment: {settings.lesion_weights_path}")

    yield  # app runs here


def create_app() -> FastAPI:
    """
    Factory function to initialize and configure the FastAPI application instance.

    - Sets application metadata (title, description, version).
    - Attaches the lifespan handler for resource management.
    - Includes the primary API router for endpoint registration.

    Returns:
        FastAPI: The fully configured application instance.
    """
    app = FastAPI(
        title=settings.app_name,
        description="API for lesion detection, pose estimation, and temporal analysis",
        version="1.0.0",
        lifespan=lifespan,   
    )

    app.include_router(router)

    return app


app = create_app()