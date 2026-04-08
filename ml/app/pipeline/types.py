from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
import numpy as np


### IMAGES
@dataclass
class ImageInput:
    """
    Parsed request input (after API validation).
    """
    img_id: str
    url: str
    timestamp: datetime
    view: str #TODO: probably should restrict to some sort of enum

@dataclass
class LoadedImage:
    """
    Image after downloading + decoding.
    """
    img_id: str
    timestamp: datetime
    view: str #TODO: probably should restrict to some sort of enum
    image: np.ndarray  # H x W x C

@dataclass
class ImageError:
    img_id: str
    timestamp: datetime
    error: str

### LESION DETECTION
@dataclass
class BoundingBox:
    x1: float
    y1: float
    x2: float
    y2: float

@dataclass
class Lesion:
    lesion_id: str
    box: BoundingBox
    score: float
    polygon_mask: List[List[float]]

    # Assigned during pose detection
    anatomical_site: Optional[str] = None

    # Filled during alignment stage
    prev_lesion_id: Optional[str] = None
    relative_size_change: Optional[float] = None


### PIPELINE
@dataclass
class LesionAnalysis:
    """
    Output of lesion detection for a single image.
    """
    img_id: str
    timestamp: datetime
    view: str #TODO: probably should restrict to some sort of enum
    lesions: List[Lesion]

@dataclass
class PoseResult:  # TODO: update
    """
    Output of pose detection for a single image.
    """
    img_id: str
    # Keep minimal for now; expand later if needed
    keypoints: Optional[List[List[float]]] = None


### Final output
@dataclass
class ImagePrediction:
    """
    Final per-image prediction (matches API response).
    """
    timestamp: datetime
    input_image_url: str
    prediction_image_url: str
    num_lesions: int
    lesions: List[Lesion]
    error: Optional[str] = None
