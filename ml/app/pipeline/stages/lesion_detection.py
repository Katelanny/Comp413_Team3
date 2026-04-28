"""
Lesion Detection Pipeline Stage.

This module encapsulates the logic for executing lesion detection on a batch 
of pre-loaded images. It serves as a wrapper around the `LesionModel`, 
handling the transition from raw image arrays to structured analysis objects.

Key Responsibilities:
- Input Validation: Operates under the contract that images have been 
  successfully downloaded and decoded.
- Batch Inference: Interfaces with the Detectron2-based LesionModel to 
  perform object detection.
- Error Isolation: Catches and logs model-level exceptions to prevent 
  the entire pipeline from crashing during inference.

Interactions:
- Input: `LoadedImage` objects containing NumPy arrays.
- Output: `LesionAnalysis` objects containing bounding boxes and masks.
"""

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
