import pytest
import numpy as np
from unittest.mock import MagicMock

from app.services.image_loader import load_images
from app.pipeline.types import LoadedImage

@pytest.mark.asyncio
async def test_load_images_success(monkeypatch, sample_images):

    mock_response = MagicMock()
    mock_response.content = b"fake_image_bytes"
    mock_response.raise_for_status = MagicMock()

    async def mock_get(*args, **kwargs):
        return mock_response

    mock_client = MagicMock()
    # mock_client.get = AsyncMock(return_value=mock_response)
    monkeypatch.setattr(
        "app.services.image_loader.httpx.AsyncClient",
        lambda *args, **kwargs: mock_client
    )

    monkeypatch.setattr(
        "app.services.image_loader._decode_image",
        lambda x: np.zeros((10, 10, 3))
    )

    loaded, errors = await load_images(sample_images)

    assert len(loaded) == 2
    assert len(errors) == 0
    assert isinstance(loaded[0], LoadedImage)

    mock_response = MagicMock()
    mock_response.content = b"fake_image_bytes"
    mock_response.raise_for_status = MagicMock()

    async def mock_get(*args, **kwargs):
        return mock_response

    mock_client = MagicMock()
    mock_client.get = mock_get 

    monkeypatch.setattr(
        "app.services.image_loader.httpx.AsyncClient",
        lambda *args, **kwargs: mock_client
    )

    monkeypatch.setattr(
        "app.services.image_loader._decode_image",
        lambda x: np.zeros((10, 10, 3))
    )

    loaded, errors = await load_images(sample_images)

    assert len(loaded) == 2
    assert len(errors) == 0
    assert isinstance(loaded[0], LoadedImage)