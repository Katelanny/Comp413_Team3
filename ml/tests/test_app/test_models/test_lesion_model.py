import pytest
import numpy as np
from unittest.mock import MagicMock

from app.models.lesion_model import LesionModel


class FakeInstances:
    def __init__(self):
        self.pred_boxes = MagicMock()
        self.pred_boxes.tensor.numpy.return_value = np.array([[0, 0, 10, 10]])

        self.scores = MagicMock()
        self.scores.numpy.return_value = np.array([0.9])

        self.pred_masks = MagicMock()
        self.pred_masks.numpy.return_value = np.array([np.zeros((10, 10))])

    def has(self, attr):
        return True

    def to(self, device):
        return self


class FakePredictor:
    def __call__(self, img):
        return {"instances": FakeInstances()}


@pytest.fixture
def sample_images():
    from app.pipeline.types import LoadedImage

    return [
        LoadedImage(
            img_id="img_1",
            timestamp="2024-01-01T00:00:00Z",
            camera_angle="0.0",
            image=np.zeros((10, 10, 3)),
        ),
        LoadedImage(
            img_id="img_2",
            timestamp="2024-01-01T00:00:00Z",
            camera_angle="0.0",
            image=np.zeros((10, 10, 3)),
        ),
    ]


def test_lesion_model_predict(monkeypatch, sample_images):

    monkeypatch.setattr(
        "app.models.lesion_model.DefaultPredictor",
        lambda cfg: FakePredictor()
    )

    monkeypatch.setattr(
        "app.models.lesion_model.LesionModel._mask_to_polygon",
        lambda self, mask: [[0.0, 0.0, 1.0, 1.0]]
    )

    model = LesionModel("config.yaml", "weights.pth")

    results = model.predict(sample_images)

    assert len(results) == 2

    for r in results:
        assert r.img_id in ["img_1", "img_2"]
        assert len(r.lesions) == 1
        assert r.lesions[0].score == 0.9
        assert r.lesions[0].polygon_mask == [[0.0, 0.0, 1.0, 1.0]]