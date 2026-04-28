import pytest
from unittest.mock import MagicMock

from app.pipeline.stages.lesion_detection import run_lesion_detection




@pytest.fixture
def sample_images():
    from app.pipeline.types import LoadedImage
    import numpy as np

    return [
        LoadedImage(
            img_id="img_1",
            timestamp="2024-01-01T00:00:00Z",
            camera_angle="0.0",
            image=np.zeros((10, 10, 3)),
        )
    ]




def test_run_lesion_detection_success(sample_images):

    fake_model = MagicMock()
    fake_output = ["lesion_analysis"]

    fake_model.predict.return_value = fake_output

    result = run_lesion_detection(sample_images, fake_model)

    assert result == fake_output
    fake_model.predict.assert_called_once_with(sample_images)




def test_run_lesion_detection_empty():

    fake_model = MagicMock()

    result = run_lesion_detection([], fake_model)

    assert result == []



def test_run_lesion_detection_failure(sample_images):

    fake_model = MagicMock()
    fake_model.predict.side_effect = Exception("model crash")

    result = run_lesion_detection(sample_images, fake_model)

    assert result == []