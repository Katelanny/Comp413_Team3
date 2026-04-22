import logging

from app.pipeline.types import LesionAnalysis
from app.services.image_loader import LoadedImage
from app.models.lesion_model import LesionModel

logger = logging.getLogger(__name__)


def run_lesion_detection(
    images: list[LoadedImage],
    lesion_model: LesionModel,
) -> list[LesionAnalysis]:
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

    except Exception as e:
        logger.error(f"Lesion detection failed: {e}")
        return []
