from typing import List

import cv2
import numpy as np
import torch

from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg

from app.pipeline.types import Lesion, LesionResult, BoundingBox


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

    def predict(self, images: List[np.ndarray], urls: List[str], timestamps: List) -> List[LesionResult]:
        """
        Run lesion detection on a batch of images.

        Args:
            images: List of np.ndarray images (H x W x C)
            urls: Corresponding image URLs
            timestamps: Corresponding timestamps

        Returns:
            List[LesionResult]
        """
        results: List[LesionResult] = []

        for img, url, ts in zip(images, urls, timestamps):
            outputs = self.predictor(img)
            instances = outputs["instances"].to("cpu")

            lesions = self._instances_to_lesions(instances, url, ts)

            results.append(
                LesionResult(
                    image_url=url,
                    timestamp=ts,
                    lesions=lesions,
                )
            )

        return results

    def _instances_to_lesions(self, instances, url: str, timestamp) -> List[Lesion]:
        """
        Convert Detectron2 Instances → List[Lesion]
        """
        boxes = instances.pred_boxes.tensor.numpy() if instances.has("pred_boxes") else []
        scores = instances.scores.numpy() if instances.has("scores") else []
        masks = instances.pred_masks.numpy() if instances.has("pred_masks") else []

        lesions: List[Lesion] = []

        for i in range(len(boxes)):
            box = boxes[i]
            score = float(scores[i])

            polygon_mask = self._mask_to_polygon(masks[i]) if len(masks) > i else []

            lesion = Lesion(
                lesion_id=f"{timestamp}_{i}",  # refined later in pipeline
                box=BoundingBox(
                    x1=float(box[0]),
                    y1=float(box[1]),
                    x2=float(box[2]),
                    y2=float(box[3]),
                ),
                score=score,
                polygon_mask=polygon_mask,
                anatomical_site="unknown",  # filled later (pose stage)
            )

            lesions.append(lesion)

        return lesions

    def _mask_to_polygon(self, mask: np.ndarray) -> List[List[float]]:
        """
        Convert binary mask → polygon(s).
        Minimal version (can improve later).
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