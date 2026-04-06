from typing import List

from fastapi import APIRouter
from datetime import datetime

from app.pipeline.pipeline import run_pipeline
from app.pipeline.types import ImageInput, LesionResult, ImageError

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel


router = APIRouter()


# init models #TODO: update paths
lesion_model = LesionModel(
    config_path="path/to/config.yaml",
    weights_path="path/to/model_final.pth",
)

pose_model = PoseModel(
    config_path="path/to/pose_config.yaml",
    weights_path="path/to/pose_model.pth",
)

# helpers


def _parse_request(images) -> List[ImageInput]:
    parsed = []
    for img in images:
        parsed.append(
            ImageInput(
                url=img["url"],
                timestamp=datetime.fromisoformat(img["timestamp"]),
            )
        )
    return parsed


def _build_predictions(
    lesion_results: List[LesionResult],
):
    predictions = []

    for res in lesion_results:
        predictions.append(
            {
                "timestamp": res.timestamp.isoformat(),
                "num_lesions": len(res.lesions),
                "input_image_url": res.image_url,
                "prediction_image_url": None,  # TODO: fill when you generate overlays
                "lesions": [
                    {
                        "lesion_id": lesion.lesion_id,
                        "box": {
                            "x1": lesion.box.x1,
                            "y1": lesion.box.y1,
                            "x2": lesion.box.x2,
                            "y2": lesion.box.y2,
                        },
                        "score": lesion.score,
                        "polygon_mask": lesion.polygon_mask,
                        "anatomical_site": lesion.anatomical_site,
                        "prev_lesion_id": lesion.prev_lesion_id,
                        "relative_size_change": lesion.relative_size_change,
                    }
                    for lesion in res.lesions
                ],
            }
        )

    return predictions


@router.post("/predict")
async def predict(request: dict):
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

    patient_id = request["patient_id"]
    images = request["images"]

    image_inputs = _parse_request(images)

    lesion_results, image_errors = run_pipeline(
        image_inputs,
        lesion_model,
        pose_model,
    )

    predictions = _build_predictions(lesion_results)

    return {
        "patient_id": patient_id,
        "predictions": predictions,
        "errors": [
            {
                "url": err.url,
                "timestamp": err.timestamp.isoformat(),
                "error": err.error,
            }
            for err in image_errors
        ]
    }
