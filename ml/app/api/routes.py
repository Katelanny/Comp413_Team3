from typing import List

from fastapi import APIRouter
from datetime import datetime

from app.pipeline.pipeline import run_pipeline
from app.pipeline.types import PredictRequest, PredictResponse

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel


router = APIRouter()


# INIT MODELS TODO: update paths
lesion_model = LesionModel(
    config_path="path/to/config.yaml",
    weights_path="path/to/model_final.pth",
)

pose_model = PoseModel(
    config_path="path/to/pose_config.yaml",
    weights_path="path/to/pose_model.pth",
)

# ENDPOINTS
@router.post("/predict")
async def predict(request: PredictRequest):
    """
    POST /predict

    Request:
        {
            "patient_id": "...",
            "images": [
                {"url": "...", "timestamp": "..."}
            ]
        }
    """

    predictions, errors = await run_pipeline(
        request.images,
        lesion_model,
        pose_model,
    )

    return PredictResponse(
            patient_id = request.patient_id,
            predictions = predictions,
            errors =errors
    )
