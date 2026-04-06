from typing import List
import numpy as np

from app.pipeline.types import PoseResult

class PoseModel:
    def __init__(self, config_path: str, weights_path: str):
        """
        Initialize pose detection model.

        Args:
            config_path: Path to model config file
            weights_path: Path to model weights
        """
        # TODO: load model (e.g., Detectron2 or other)
        raise NotImplementedError("Pose model initialization not implemented")

    def predict(
        self,
        images: List[np.ndarray],
        urls: List[str],
        timestamps: List,
    ) -> List[PoseResult]:
        """
        Run pose detection on a batch of images.

        Args:
            images: List of np.ndarray images (H x W x C)
            urls: Corresponding image URLs
            timestamps: Corresponding timestamps

        Returns:
            List[PoseResult] aligned with input order
        """

        #TODO:
        raise NotImplementedError("Pose prediction not implemented")