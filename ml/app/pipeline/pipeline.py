from typing import List, Tuple

from app.pipeline.types import ImageInput, LesionResult, ImageError
from app.services.image_loader import load_images, ImageLoadResult

from app.models.lesion_model import LesionModel
from app.models.pose_model import PoseModel

from app.pipeline.stages.lesion_detection import run_lesion_detection
from app.pipeline.stages.pose_detection import run_pose_detection
from app.pipeline.stages.lesion_matching_by_time import run_lesion_matching_by_time


def run_pipeline(
    image_inputs: List[ImageInput],
    lesion_model: LesionModel,
    pose_model: PoseModel,
) -> Tuple[List[LesionResult], List[ImageError]]:
    """
    Main pipeline:
        1. Load images
        2. Split valid vs failed
        3. Run lesion detection
        4. Run pose detection
        5. Run temporal alignment
        6. Return results + errors
    """
    load_results: List[ImageLoadResult] = load_images(image_inputs)

    valid_image_results: List[ImageLoadResult] = []
    image_errors: List[ImageError] = []

    for img_res in load_results:
        if img_res.error is None and img_res.image is not None:
            valid_image_results.append(img_res)
        else:
            image_errors.append(
                ImageError(
                    url=img_res.url,
                    timestamp=img_res.timestamp,
                    error=img_res.error or "unknown_error",
                )
            )

    if not valid_image_results:
        return [], image_errors

    # 1. Lesion Detection
    lesion_results: List[LesionResult] = run_lesion_detection(
        valid_image_results,
        lesion_model,
    )

    if not len(lesion_results):
        for img in valid_image_results:
            image_errors.append(
                ImageError(
                    url=img.url,
                    timestamp=img.timestamp,
                    error="lesion_detection_failed",
                )
            )
        return [], image_errors

    # 2. Pose Detection
    lesion_results = run_pose_detection(valid_image_results, lesion_results, pose_model)

    # 3. Lesion Matching by Time
    lesion_results = run_lesion_matching_by_time(lesion_results)

    return lesion_results, image_errors
