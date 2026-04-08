from app.pipeline.types import ImageRequest, LesionAnalysis, ImageError, Prediction
from app.services.image_loader import load_images

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel

from app.pipeline.stages.lesion_detection import run_lesion_detection
from app.pipeline.stages.pose_detection import run_pose_detection
from app.pipeline.stages.lesion_matching_by_time import run_lesion_matching_by_time


async def run_pipeline(
    images: list[ImageRequest],
    lesion_model: LesionModel,
    pose_model: PoseModel,
) -> tuple[list[Prediction], list[ImageError]]:
    """
    Main pipeline:
        1. Load images
        2. Split valid vs failed
        3. Run lesion detection
        4. Run pose detection
        5. Run temporal alignment
        6. Return results + errors
    """

    valid_images, image_errors = await load_images(images)

    if not valid_images:
        return [], image_errors
    
    # 1. lesion detection
    lesion_analysis: list[LesionAnalysis] = run_lesion_detection(valid_images, lesion_model)

    if not lesion_analysis:
        for img in valid_images:
            image_errors.append(
                ImageError(
                    img_id = img.img_id,
                    timestamp=img.timestamp,
                    error="lesion_detection_failed",
                )
            )
        return [], image_errors

    # maybe don't mutate lesion_analysis and return new obj? :

    # 2. pose detection, mutates lesion_analysis
    # TODO: run_pose_detection(valid_images, lesion_analysis, pose_model)

    # 3. lesion matching by time, mutates lesion_analysis
    #TODO: run_lesion_matching_by_time(lesion_analysis)

    return lesion_analysis.to_prediction(), image_errors
