import pytest
from unittest.mock import MagicMock, patch
from fastapi import FastAPI
import sys

sys.modules["download_models"] = MagicMock()
sys.modules["google"] = MagicMock()
sys.modules["google.cloud"] = MagicMock()
sys.modules["google.cloud.storage"] = MagicMock()
from app.main import create_app, lifespan


@pytest.fixture
def app():
    return create_app()


def test_router_is_attached(app):
    route_paths = [route.path for route in app.routes]
    assert len(route_paths) > 1


def test_predict_route_exists(app):
    assert any("/predict" in route.path for route in app.routes)


def test_app_creation(app):
    assert app is not None
    assert app.title is not None
    assert app.version == "1.0.0"


@pytest.mark.asyncio
async def test_lifespan_initializes_models():
    app = FastAPI()

    # patch ONLY where used (clean + local scope)
    with patch("app.main.download_model_files") as mock_download, \
         patch("app.main.LesionModel") as MockLesion, \
         patch("app.main.PoseModel") as MockPose:

        mock_download.return_value = None

        lesion_instance = MagicMock()
        pose_instance = MagicMock()

        MockLesion.return_value = lesion_instance
        MockPose.return_value = pose_instance

        async with lifespan(app):
            pass

        mock_download.assert_called_once()
        assert app.state.lesion_model is lesion_instance
        assert app.state.pose_model is pose_instance