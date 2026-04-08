from app.pipeline.types import LesionAnalysis
from app.services.image_loader import LoadedImage
from app.models.pose_model import PoseModel


def run_pose_detection(
    images: list[LoadedImage],
    lesion_analysis: list[LesionAnalysis],
    pose_model: PoseModel,
) -> None:
    """
    Runs pose detection on already validated images.

    Assumes:
        - All inputs have image != None
        - All inputs have error == None

    Returns:
        List[PoseResult] aligned with input order
    """

    if not images:
        return []


    try:
        pose_results = pose_model.predict(
            images
        )
    except Exception:
        return lesion_analysis

    # TODO: combine info from pose_result to fill in the anatomical site in lesion_result

    
