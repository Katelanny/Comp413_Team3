from dataclasses import dataclass
from datetime import datetime
import numpy as np
from pydantic import BaseModel, HttpUrl

### API SCHEMAS

# Request:
class ImageRequest(BaseModel):
    img_id: str
    url: HttpUrl
    timestamp: datetime
    view: str  # TODO: convert to Enum

class PredictRequest(BaseModel):
    patient_id: str
    images: list[ImageRequest]


# Response:
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class Lesion(BaseModel):
    lesion_id: str
    box: BoundingBox
    score: float
    polygon_mask: list[list[float]]

    anatomical_site: str | None = None
    prev_lesion_id:  str | None = None
    relative_size_change:  float | None = None

class Prediction(BaseModel):
    img_id: str
    timestamp: datetime
    num_lesions: int
    lesions: list[Lesion]

class ImageError(BaseModel):
    img_id: str
    timestamp: datetime
    error: str

class PredictResponse(BaseModel):
    patient_id: str
    predictions: list[Prediction]
    errors: list[ImageError]


### Internal Dataclasses

@dataclass
class LoadedImage:
    """
    Image after downloading + decoding.
    """
    img_id: str
    timestamp: datetime
    view: str #TODO: enum?
    image: np.ndarray  # H x W x C

### PIPELINE OUTPUTS

@dataclass
class LesionAnalysis:
    img_id: str
    timestamp: datetime
    view: str
    lesions: list[Lesion]

    def to_prediction(self) -> Prediction:
        return Prediction(
            img_id=self.img_id,
            timestamp=self.timestamp,
            num_lesions=len(self.lesions),
            lesions=self.lesions,
        )

@dataclass
class PoseResult:
    img_id: str
    keypoints: list[list[float]] | None
