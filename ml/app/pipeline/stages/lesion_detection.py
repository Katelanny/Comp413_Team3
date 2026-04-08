from typing import List

from app.pipeline.types import LesionAnalysis
from app.services.image_loader import LoadedImage
from app.models.lesion_model import LesionModel


def run_lesion_detection(
    images: List[LoadedImage],
    lesion_model: LesionModel,
) -> List[LesionAnalysis]:
    """
    Runs lesion detection on already validated images.

    Assumes:
        - All inputs have image != None
        - All inputs have error == None

    Returns:
        List[LesionResult] aligned with input order
    """

    if not images:
        return []

    try:
        lesion_analysis = lesion_model.predict(images)
        return lesion_analysis

    except Exception:
        return []
