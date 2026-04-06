from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
import numpy as np


### Input Classes
@dataclass
class ImageInput:
    """
    Parsed request input (after API validation).
    """
    url: str
    timestamp: datetime


@dataclass
class LoadedImage:
    """
    Image after downloading + decoding.
    """
    url: str
    timestamp: datetime
    image: np.ndarray  # H x W x C


### Lesion Detection Output Types

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
    anatomical_site: str

    # Filled during alignment stage
    prev_lesion_id: Optional[str] = None
    relative_size_change: Optional[float] = None


### Intermediate pipeline stage outputs
@dataclass
class ImageLoadResult:
    url: str
    timestamp: datetime
    image: Optional[np.ndarray]
    error: Optional[str] = None

@dataclass
class LesionResult:
    """
    Output of lesion detection for a single image.
    """
    image_url: str
    timestamp: datetime
    lesions: List[Lesion]


@dataclass
class PoseResult: #TODO: update 
    """
    Output of pose detection for a single image.
    """
    image_url: str
    timestamp: datetime
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