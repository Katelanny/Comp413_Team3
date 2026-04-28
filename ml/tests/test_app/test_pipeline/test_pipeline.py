import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock

from app.pipeline.pipeline import run_pipeline
from app.pipeline.types import (
    ImageRequest,
    ImageError,
    Prediction,
    LoadedImage,
    LesionAnalysis,
    Lesion,
    BoundingBox,
)


@pytest.fixture
def sample_requests():
    return [
        ImageRequest(
            img_id="img_1",
            url="http://test.com/1.jpg",
            timestamp="2024-01-01T00:00:00Z",
            camera_angle="0.0",
        ),
        ImageRequest(
            img_id="img_2",
            url="http://test.com/2.jpg",
            timestamp="2024-01-02T00:00:00Z",
            camera_angle="0.0",
        ),
    ]


@pytest.fixture
def fake_loaded_images():
    return [
        LoadedImage(
            img_id="img_1",
            timestamp="2024-01-01T00:00:00Z",
            camera_angle="0.0",
            image=np.zeros((10, 10, 3)),
        ),
        LoadedImage(
            img_id="img_2",
            timestamp="2024-01-02T00:00:00Z",
            camera_angle="0.0",
            image=np.zeros((10, 10, 3)),
        ),
    ]



@pytest.mark.asyncio
async def test_pipeline_success(monkeypatch, sample_requests, fake_loaded_images):

    monkeypatch.setattr(
        "app.pipeline.pipeline.load_images",
        AsyncMock(return_value=(fake_loaded_images, [])),
    )

    lesion = Lesion(
        lesion_id="img_1_0",
        box=BoundingBox(x1=10, y1=10, x2=20, y2=20),
        score=0.9,
        polygon_mask=[],
    )

    lesion_analysis = [
        LesionAnalysis(
            img_id="img_1",
            timestamp="2024-01-01T00:00:00Z",
            camera_angle="0.0",
            lesions=[lesion],
        ),
        LesionAnalysis(
            img_id="img_2",
            timestamp="2024-01-02T00:00:00Z",
            camera_angle="0.0",
            lesions=[lesion],
        ),
    ]

    mock_lesion_model = MagicMock()
    mock_lesion_model.predict.return_value = lesion_analysis

    pose_result = MagicMock()
    pose_result.is_empty = True  # keep simple

    mock_pose_model = MagicMock()
    mock_pose_model.predict.return_value = [pose_result, pose_result]

    predictions, errors = await run_pipeline(
        sample_requests,
        mock_lesion_model,
        mock_pose_model,
    )

    assert len(predictions) == 2
    assert isinstance(predictions[0], Prediction)
    assert len(errors) == 0



@pytest.mark.asyncio
async def test_pipeline_no_images(monkeypatch, sample_requests):

    monkeypatch.setattr(
        "app.pipeline.pipeline.load_images",
        AsyncMock(return_value=([], [])),
    )

    mock_lesion_model = MagicMock()
    mock_pose_model = MagicMock()

    predictions, errors = await run_pipeline(
        sample_requests,
        mock_lesion_model,
        mock_pose_model,
    )

    assert predictions == []
    assert isinstance(errors, list)



@pytest.mark.asyncio
async def test_pipeline_lesion_failure(monkeypatch, sample_requests, fake_loaded_images):

    monkeypatch.setattr(
        "app.pipeline.pipeline.load_images",
        AsyncMock(return_value=(fake_loaded_images, [])),
    )

    monkeypatch.setattr(
        "app.pipeline.pipeline.run_lesion_detection",
        lambda imgs, model: [],
    )

    mock_lesion_model = MagicMock()
    mock_pose_model = MagicMock()

    predictions, errors = await run_pipeline(
        sample_requests,
        mock_lesion_model,
        mock_pose_model,
    )

    assert predictions == []
    assert len(errors) == 2
    assert all(isinstance(e, ImageError) for e in errors)