import os
from google.cloud import storage

from app.config import settings


# Maps GCS blob path -> local destination path.
# Local paths are driven by settings (env vars on Cloud Run, defaults locally)
# so the downloader always agrees with what the app expects to load.
MODEL_FILES = [
    ("models/lesion/config.yaml",           settings.lesion_config_path),
    ("models/model.pth",                    settings.lesion_weights_path),
    ("models/lesion/pose/pose_config.yaml", settings.pose_config_path),
    ("models/pose/model_final.pth",         settings.pose_weights_path),
]


def download_model_files():
    client = storage.Client()
    bucket = client.bucket("comp-413-class")

    for blob_path, local_path in MODEL_FILES:
        if os.path.exists(local_path):
            print(f"Already exists, skipping: {local_path}")
            continue

        parent = os.path.dirname(local_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        print(f"Downloading {blob_path} -> {local_path}")
        bucket.blob(blob_path).download_to_filename(local_path)
        print(f"Done: {local_path}")


if __name__ == "__main__":
    download_model_files()
