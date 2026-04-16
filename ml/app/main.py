from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel
from app.api.routes import router
from app.config import settings
from download_models import download_model_files

@asynccontextmanager
async def lifespan(app: FastAPI):
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

    # SHUTDOWN (optional cleanup)
    # e.g., release GPU memory, close sessions


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="API for lesion detection, pose estimation, and temporal analysis",
        version="1.0.0",
        lifespan=lifespan,   
    )

    app.include_router(router)

    return app


app = create_app()