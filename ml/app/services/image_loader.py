import asyncio
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
from io import BytesIO

import httpx
import numpy as np
from PIL import Image

from app.pipeline.types import ImageInput, ImageLoadResult


MAX_CONCURRENT_DOWNLOADS = 10
REQUEST_TIMEOUT = 10.0  # seconds


# =========================
# Result Type (internal)
# =========================


# =========================
# Public API
# =========================

async def load_images(image_inputs: List[ImageInput]) -> List[ImageLoadResult]:
    """
    Downloads and decodes images concurrently.

    Returns:
        List[ImageLoadResult] with same length/order as input.
        Each item contains either:
            - image (success)
            - error (failure)
    """
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        tasks = [
            _load_single_image(client, semaphore, img_input)
            for img_input in image_inputs
        ]

        results = await asyncio.gather(*tasks)

    return results


# =========================
# Internal Helpers
# =========================

async def _load_single_image(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    img_input: ImageInput,
) -> ImageLoadResult:
    """
    Downloads and decodes a single image.
    Always returns an ImageLoadResult (never raises).
    """
    async with semaphore:
        try:
            response = await client.get(img_input.url)
            response.raise_for_status()

            image = _decode_image(response.content)

            return ImageLoadResult(
                url=img_input.url,
                timestamp=img_input.timestamp,
                image=image,
                error=None,
            )

        except httpx.HTTPError:
            return ImageLoadResult(
                url=img_input.url,
                timestamp=img_input.timestamp,
                image=None,
                error="download_failed",
            )

        except Exception:
            return ImageLoadResult(
                url=img_input.url,
                timestamp=img_input.timestamp,
                image=None,
                error="decode_failed",
            )


def _decode_image(image_bytes: bytes) -> np.ndarray:
    """
    Converts raw bytes → numpy array (H x W x C).
    Ensures RGB format.
    """
    with Image.open(BytesIO(image_bytes)) as img:
        img = img.convert("RGB")
        return np.array(img)