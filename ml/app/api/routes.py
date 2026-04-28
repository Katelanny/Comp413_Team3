"""
API Routing and Endpoint Definitions.

This module defines the RESTful interface for the application. It handles 
incoming HTTP requests, validates payloads against predefined Pydantic 
schemas, and coordinates the execution of the ML pipeline.

Key Features:
- Dependency Injection: Uses `get_models` to retrieve pre-loaded ML model 
  instances from the FastAPI application state.
- Structured Responses: Ensures all outputs adhere to the `PredictResponse` 
  schema, providing a consistent contract for frontend or mobile clients.
- Error Integration: Returns both successful predictions and logged image 
  processing errors within a single unified response.
"""

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

