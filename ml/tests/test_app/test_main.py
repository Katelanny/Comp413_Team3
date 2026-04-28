import pytest
from unittest.mock import MagicMock, patch


import sys

sys.modules["download_models"] = MagicMock()

sys.modules["google"] = MagicMock()
sys.modules["google.cloud"] = MagicMock()
sys.modules["google.cloud.storage"] = MagicMock()

from app.main import create_app


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