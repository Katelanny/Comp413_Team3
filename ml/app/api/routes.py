from fastapi import APIRouter, Depends, Request

from app.pipeline.pipeline import run_pipeline
from app.pipeline.types import PredictRequest, PredictResponse


router = APIRouter()

def get_models(request: Request):
    return request.app.state.lesion_model, request.app.state.pose_model

# ENDPOINTS
@router.post("/predict", response_model=PredictResponse)
async def predict(body: PredictRequest, models = Depends(get_models)):
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
    lesion_model, pose_model = models

    predictions, errors = await run_pipeline(
        body.images,
        lesion_model,
        pose_model,
    )

    return PredictResponse(
            patient_id = body.patient_id,
            predictions = predictions,
            errors =errors
    )

