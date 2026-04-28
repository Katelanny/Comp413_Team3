"""
Lesion Detection Model Wrapper.

This module provides the `LesionModel` class, which encapsulates a Detectron2 
Instance Segmentation model. It handles model initialization, device 
allocation (CPU/GPU), and the post-processing of raw prediction tensors 
into standardized application types.

Key Features:
- Configuration Management: Loads Detectron2 YAML configs and .pth weights.
- Inference Logic: Performs sequential image inference.
- Data Transformation: Converts Detectron2 `Instances` (tensors) into 
  `Lesion` objects, including bounding box extraction and binary mask 
  to polygon conversion via OpenCV.
"""

import cv2
import numpy as np
import torch

from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg

from app.pipeline.types import Lesion, LoadedImage, LesionAnalysis, BoundingBox

class LesionModel:
    def __init__(self, config_path: str, weights_path: str, score_thresh: float = 0.3):
        """
        Initialize Detectron2 predictor.
        """
        cfg = get_cfg()
        cfg.merge_from_file(config_path)

        cfg.MODEL.WEIGHTS = weights_path
        cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = score_thresh
        cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

        self.predictor = DefaultPredictor(cfg)

    def predict(self, images: list[LoadedImage]) -> list[LesionAnalysis]:
        """
        Run lesion detection on a batch of images.

        Args:
            images: List of np.ndarray images (H x W x C)
            ids: Corresponding image ids
            timestamps: Corresponding timestamps

        Returns:
            List[LesionResult]
        """
        results: list[LesionAnalysis] = []

        for img in images:
            outputs = self.predictor(img.image)
            instances = outputs["instances"].to("cpu")

            lesions = self._instances_to_lesions(instances, img.img_id)

            results.append(
                LesionAnalysis(
                    img_id=img.img_id,
                    timestamp=img.timestamp,
                    camera_angle = img.camera_angle,
                    lesions=lesions,
                )
            )

        return results

    def _instances_to_lesions(self, instances, img_id: str) -> list[Lesion]:
        """
        Convert Detectron2 Instances → list[Lesion]
        """
        boxes = (
            instances.pred_boxes.tensor.numpy() if instances.has("pred_boxes") else []
        )
        scores = instances.scores.numpy() if instances.has("scores") else []
        masks = instances.pred_masks.numpy() if instances.has("pred_masks") else []

        lesions: list[Lesion] = []

        for i in range(len(boxes)):
            box = boxes[i]
            score = float(scores[i])

            polygon_mask = self._mask_to_polygon(masks[i]) if len(masks) > i else []
   
            lesion = Lesion(
                lesion_id= f"{img_id}_{i}", # globally unique id
                box=BoundingBox(
                    x1=float(box[0]),
                    y1=float(box[1]),
                    x2=float(box[2]),
                    y2=float(box[3]),
                ),
                score=score,
                polygon_mask=polygon_mask,
            )

            lesions.append(lesion)

        return lesions

    def _mask_to_polygon(self, mask: np.ndarray) -> list[list[float]]:
        """
        Convert binary mask → polygon(s).
        """

        contours, _ = cv2.findContours(
            mask.astype("uint8"),
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        polygons = []
        for contour in contours:
            contour = contour.flatten().tolist()
            polygons.append([float(x) for x in contour])

        return polygons
