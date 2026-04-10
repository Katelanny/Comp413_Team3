import asyncio
from io import BytesIO

import httpx
import numpy as np
from PIL import Image

from app.pipeline.types import ImageRequest, LoadedImage, ImageError


MAX_CONCURRENT_DOWNLOADS = 10
REQUEST_TIMEOUT = 10.0  # seconds


async def load_images(image_inputs: list[ImageRequest]) -> tuple[list[LoadedImage], list[ImageError]]:
    """
    Downloads and decodes images concurrently.

    Returns:
        list[LoadedImage | ImageError] with same length as input.
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

    valid_images: list[LoadedImage] = [res for res in results if isinstance(res, LoadedImage)]
    image_errors: list[ImageError] = [res for res in results if isinstance(res, ImageError)]

    return valid_images, image_errors


async def _load_single_image(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    img_input: ImageRequest,
) -> LoadedImage | ImageError:
    """
    Downloads and decodes a single image.
    Always returns an ImageLoadResult (never raises).
    """
    async with semaphore:
        try:
            response = await client.get(img_input.url)
            response.raise_for_status()

            image = _decode_image(response.content)

            return LoadedImage(
                img_id = img_input.img_id,
                timestamp=img_input.timestamp,
                view = img_input.view,
                image=image,
            )

        except httpx.HTTPError:
            return ImageError(
                img_id = img_input.img_id,
                timestamp=img_input.timestamp,
                error="download_failed",
            )

        except Exception:
            return ImageError(
                img_id = img_input.img_id,
                timestamp=img_input.timestamp,
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
