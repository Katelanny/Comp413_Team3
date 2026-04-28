"""
Pose Estimation Model Wrapper (DensePose).

This module provides the `PoseModel` class, which manages a Detectron2-based 
DensePose architecture. Unlike standard pose estimation that identifies 
skeletal joints, DensePose provides a dense mapping of image pixels to 
the 3D surface of the human body using a UV coordinate system.

Key Responsibilities:
- Patching & Compatibility: Overrides `torch.load` to support legacy 
  DensePose checkpoints with complex picklable metadata.
- Surface Mapping: Extracts Fine Segmentation (I), and Surface Coordinates (U, V) 
  from the model's prediction head.
- Coordination: Transforms pixel-space detections into body-part-centric 
  matrices for downstream anatomical mapping.
- Error Resilience: Handles cases where no humans are detected in the frame 
  by returning an empty state instead of crashing.
"""

from app.pipeline.types import LoadedImage, PoseResult
import torch
import numpy as np
import logging

# Force torch.load to allow full unpickling for trusted DensePose checkpoints.
# DensePose weights contain objects (e.g. numpy scalars) that fail PyTorch's
# newer weights_only=True default. We trust our own GCS-hosted checkpoints.
_original_torch_load = torch.load
def _torch_load_full(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _original_torch_load(*args, **kwargs)
torch.load = _torch_load_full

from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from densepose import add_densepose_config

logger = logging.getLogger(__name__)


class PoseModel:
    def __init__(self, config_path: str, weights_path: str, device: str = "cuda"):
        """
        Initialize pose detection model.

        Args:
            config_path: Path to model config file
            weights_path: Path to model weights
            device: "cuda" or "cpu" for gpu or cpu
        """
        #Setting up Detectron2 DensePose model
        self.cfg = get_cfg()
        add_densepose_config(self.cfg)
        self.cfg.merge_from_file(config_path)
        self.cfg.MODEL.WEIGHTS = weights_path

        #Default to GPU, but fall back to CPU if not available
        if device == "cuda" and not torch.cuda.is_available():
            logging.warning("CUDA requested but not available, falling back to CPU")
            self.cfg.MODEL.DEVICE = "cpu"
        else:
            self.cfg.MODEL.DEVICE = device

        #Building predictor
        try:
            self.predictor = DefaultPredictor(self.cfg)
            logger.info("DensePose model loaded successfully")
        except Exception as e:
            logging.error(f"Error loading DensePose model: {e}")
            raise

    def predict(
        self,
        images: list[LoadedImage],
    ) -> list[PoseResult]:
        """
        Run pose detection on a batch of images.

        Args:
            images: list of LoadedImage

        Returns:
            list[PoseResult]
        """
        if not images:
            return []
        
        pose_results = []

        for img in images:
            img_array = img.image

            try:
                #Running neural network
                outputs = self.predictor(img_array)
                instances = outputs["instances"]

                # Checking for human detection
                if len(instances) == 0 or not instances.has("pred_densepose"):
                    logging.info(f"No human detected in image {img.img_id}")
                    pose_results.append(PoseResult(is_empty=True))
                    continue

                # Extracting highest confidence detection
                patient_box = instances.pred_boxes.tensor.cpu().numpy()[0] # [x1, y1, x2, y2]
                dp_results = instances.pred_densepose

                #Extracting matrices mapping 3D surface
                I_matrix = dp_results.fine_segm[0].cpu().numpy()
                U_matrix = dp_results.u[0].cpu().numpy()
                V_matrix = dp_results.v[0].cpu().numpy()

                I_matrix = I_matrix.argmax(axis=0)

                # Appending results
                pose_results.append(PoseResult(
                    is_empty=False,
                    patient_box=patient_box,
                    I_matrix=I_matrix,
                    U_matrix=U_matrix,
                    V_matrix=V_matrix,
                ))
            except Exception as e:
                logging.error(f"Error during pose prediction for an image: {e}")
                pose_results.append(PoseResult(is_empty=True))

        return pose_results
                

