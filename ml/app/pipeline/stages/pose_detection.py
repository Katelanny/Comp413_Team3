from typing import List

from app.pipeline.types import LesionResult, PoseResult
from app.services.image_loader import ImageLoadResult
from app.models.pose_model import PoseModel


def run_pose_detection(
    valid_image_results: List[ImageLoadResult],
    lesion_results: List[LesionResult],
    pose_model: PoseModel,
) -> List[PoseResult]:
    """
    Runs pose detection on already validated images.

    Assumes:
        - All inputs have image != None
        - All inputs have error == None

    Returns:
        List[PoseResult] aligned with input order
    """

    if not valid_image_results:
        return []

    images = [img.image for img in valid_image_results]
    urls = [img.url for img in valid_image_results]
    timestamps = [img.timestamp for img in valid_image_results]

    try:
        pose_results = pose_model.predict(
            images,
            urls,
            timestamps,
        )
    except Exception:
        return lesion_results

    # TODO: combine info from pose_result to fill in the anatomical site in lesion_result

    return lesion_results
