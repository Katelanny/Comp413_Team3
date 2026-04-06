from typing import List

from app.pipeline.types import LesionResult
from app.services.image_loader import ImageLoadResult
from app.models.lesion_model import LesionModel


def run_lesion_detection(
    valid_image_results: List[ImageLoadResult],
    lesion_model: LesionModel,
) -> List[LesionResult]:
    """
    Runs lesion detection on already validated images.

    Assumes:
        - All inputs have image != None
        - All inputs have error == None

    Returns:
        List[LesionResult] aligned with input order
    """

    if not valid_image_results:
        return []

    images = [img.image for img in valid_image_results]
    urls = [img.url for img in valid_image_results]
    timestamps = [img.timestamp for img in valid_image_results]

    try:
        lesion_results = lesion_model.predict(
            images,
            urls,
            timestamps,
        )
        return lesion_results

    except Exception:
        return []
