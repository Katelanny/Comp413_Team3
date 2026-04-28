import pytest
import numpy as np
from unittest.mock import MagicMock

from app.models.pose_model import PoseModel



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


class FakeInstances:
    def __len__(self):
        return 1

    def has(self, attr):
        return True

    @property
    def pred_boxes(self):
        box = MagicMock()
        box.tensor.cpu.return_value.numpy.return_value = np.array([[1, 2, 3, 4]])
        return box

    @property
    def pred_densepose(self):
        dp = MagicMock()

        dp.fine_segm = [MagicMock()]
        dp.fine_segm[0].cpu.return_value.numpy.return_value = np.zeros((2, 2, 2))

        dp.u = [MagicMock()]
        dp.u[0].cpu.return_value.numpy.return_value = np.zeros((2, 2))

        dp.v = [MagicMock()]
        dp.v[0].cpu.return_value.numpy.return_value = np.zeros((2, 2))

        return dp


class FakePredictor:
    def __call__(self, img):
        return {"instances": FakeInstances()}



def test_pose_model_predict(monkeypatch, sample_images):

    monkeypatch.setattr(
        "app.models.pose_model.DefaultPredictor",
        lambda cfg: FakePredictor()
    )

    monkeypatch.setattr(
        "torch.cuda.is_available",
        lambda: False
    )

    model = PoseModel("config.yaml", "weights.pth", device="cpu")

    results = model.predict(sample_images)

    assert len(results) == 2

    for r in results:
        assert r.is_empty is False
        assert r.patient_box.shape == (4,)
        assert r.I_matrix is not None
        assert r.U_matrix is not None
        assert r.V_matrix is not None