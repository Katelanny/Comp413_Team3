from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    app.state.lesion_model = LesionModel(
        config_path="models/lesion/config.yaml",
        weights_path="models/lesion/model_final.pth",
    )

    # TODO: update
    app.state.pose_model = PoseModel(
        config_path="path/to/pose_config.yaml",
        weights_path="path/to/pose_model.pth",
    )

    yield  # app runs here

    # SHUTDOWN (optional cleanup)
    # e.g., release GPU memory, close sessions


def create_app() -> FastAPI:
    app = FastAPI(
        title="Lesion Analysis Service",
        description="API for lesion detection, pose estimation, and temporal analysis",
        version="1.0.0",
        lifespan=lifespan,   
    )

    app.include_router(router)

    return app


app = create_app()