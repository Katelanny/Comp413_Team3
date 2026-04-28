"""
Pipeline Type Definitions and Data Contracts.

This module centralizes the schemas used throughout the application, categorized into:
1. API Schemas: Pydantic models for external request/response validation.
2. Internal Dataclasses: Optimized structures for in-memory image and model data.
3. Pipeline Outputs: Aggregated results that combine computer vision outputs 
   with temporal analysis logic.

"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import numpy as np
from pydantic import BaseModel, HttpUrl

### API SCHEMAS

class ImageRequest(BaseModel):
    """Schema for a single image source within a prediction request."""
    img_id: str
    url: HttpUrl
    timestamp: datetime
    camera_angle: str

class PredictRequest(BaseModel):
    """The root request object containing patient metadata and image batch URLs."""
    patient_id: str
    images: list[ImageRequest]

class BoundingBox(BaseModel):
    """Standard [x1, y1, x2, y2] coordinates for object localization."""
    x1: float
    y1: float
    x2: float
    y2: float

class Lesion(BaseModel):
    """
    Representation of a detected lesion, including its geometry, 
    confidence score, and optional UV/Temporal mapping data.
    """
    lesion_id: str
    box: BoundingBox
    score: float
    polygon_mask: list[list[float]]

    u_coord: float | None = None
    v_coord: float | None = None

    anatomical_site: str | None = None
    prev_lesion_id:  str | None = None
    relative_size_change:  float | None = None

class Prediction(BaseModel):
    """
    Structured results for a single successfully processed image.
    
    Contains the collection of all detected lesions and metadata identifying 
    the specific timepoint and source image. This acts as the primary 
    payload for successful analysis.
    """
    img_id: str
    timestamp: datetime
    num_lesions: int
    lesions: list[Lesion]

class ImageError(BaseModel):
    """
    Error container for individual image processing failures.
    
    Ensures that if a single image fails (due to download timeout, 
    corruption, or inference errors), the specific failure is logged 
    without crashing the entire batch request.
    """
    img_id: str
    timestamp: datetime
    error: str

class PredictResponse(BaseModel):
    """The final structured output returned to the client, including errors."""
    patient_id: str
    predictions: list[Prediction]
    errors: list[ImageError]


### Internal Dataclasses

@dataclass
class LoadedImage:
    """
    Represents an image that has been successfully retrieved and decoded 
    into a NumPy array, ready for model inference.
    """
    img_id: str
    timestamp: datetime
    camera_angle: str
    image: np.ndarray  # H x W x C

### PIPELINE OUTPUTS

@dataclass
class LesionAnalysis:
    """
    The intermediate result of a single image's processing, combining 
    detected lesions with optional pose/person localization data.
    """
    img_id: str
    timestamp: datetime
    camera_angle: str
    lesions: list[Lesion]
    person_box: tuple[float, float, float, float] | None = None  # (x1, y1, x2, y2) in image pixel space

    def to_prediction(self) -> Prediction:
        return Prediction(
            img_id=self.img_id,
            timestamp=self.timestamp,
            num_lesions=len(self.lesions),
            lesions=self.lesions,
        )

@dataclass
class PoseResult:
    """
    Storing native array outputs from DensePose
    """
    is_empty: bool = True
    patient_box: Optional[np.ndarray] = None #[x1, y1, x2, y2]
    I_matrix: Optional[np.ndarray] = None #Body part segmentation
    U_matrix: Optional[np.ndarray] = None #U coordinate map
    V_matrix: Optional[np.ndarray] = None #V coordinate map


