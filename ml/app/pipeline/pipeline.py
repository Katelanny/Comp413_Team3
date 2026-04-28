"""
Main Pipeline Orchestration Module.

This module defines the core execution logic for the ML inference workflow. 
It coordinates the sequence of operations required to transform raw image 
URLs into structured lesion and pose predictions with temporal alignment.

Workflow Sequence:
1. Asynchronous Acquisition: Fetches and decodes images concurrently.
2. Error Partitioning: Separates successfully loaded images from network failures.
3. Lesion Detection: Executes object detection to identify potential lesions.
4. Pose Estimation: Performs DensePose analysis to provide spatial context (UV coordinates).
5. Temporal Matching: Correlates detected lesions across different timepoints.
6. Serialization: Converts internal analysis objects into API-compliant predictions.

The pipeline follows a 'Fail-Fast but Partial-Success' model. If specific 
images fail at any stage, they are logged as ImageErrors, while successful 
images continue through the remaining stages.
"""

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
    run_pose_detection(valid_images, lesion_analysis, pose_model)

    # 3. lesion matching by time, mutates lesion_analysis
    run_lesion_matching_by_time(lesion_analysis)

    predictions = [la.to_prediction() for la in lesion_analysis]
    return predictions, image_errors
