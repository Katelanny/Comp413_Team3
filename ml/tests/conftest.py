import sys
from unittest.mock import MagicMock
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock

from app.pipeline.types import ImageRequest

sys.modules["detectron2"] = MagicMock()
sys.modules["detectron2.engine"] = MagicMock()
sys.modules["detectron2.config"] = MagicMock()
sys.modules["detectron2.model_zoo"] = MagicMock()

sys.modules["densepose"] = MagicMock()
sys.modules["torch"] = MagicMock()
sys.modules["cv2"] = MagicMock()



@pytest.fixture
def client(mocker):
    from app.api.routes import router

    app = FastAPI()
    app.state.lesion_model = MagicMock()
    app.state.pose_model = MagicMock()
    app.include_router(router)

    return TestClient(app)


@pytest.fixture
def mock_pipeline(mocker):
    mock = mocker.AsyncMock()
    mocker.patch("app.api.routes.run_pipeline", mock)
    return mock


@pytest.fixture
def valid_payload():
    return {
        "patient_id": "123",
        "images": [
            {
                "img_id": "img_1",
                "url": "http://test.com/img1.jpg",
                "timestamp": "2024-01-01T00:00:00Z",
                "camera_angle": "0.0"
            }
        ]
    }



@pytest.fixture
def sample_images():
    return [
        ImageRequest(
            img_id="img_1",
            url="http://test.com/1.jpg",
            timestamp=datetime(2024, 1, 1, tzinfo=timezone.utc),
            camera_angle="0.0"
        ),
        ImageRequest(
            img_id="img_2",
            url="http://test.com/2.jpg",
            timestamp=datetime(2024, 1, 1, tzinfo=timezone.utc),
            camera_angle="0.0"
        )
    ]

