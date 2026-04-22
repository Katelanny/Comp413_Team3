import os
from google.cloud import storage


# Maps GCS blob path -> local destination path (where app expects the files)
MODEL_FILES = [
    ("models/model.pth",                 "models/lesion/model_final.pth"),
    ("models/pose/model_final.pth",      "models/pose/model_final_162be9.pkl"),
]


def download_model_files():
    client = storage.Client()
    bucket = client.bucket("comp-413-class")

    for blob_path, local_path in MODEL_FILES:
        if os.path.exists(local_path):
            print(f"Already exists, skipping: {local_path}")
            continue

        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        print(f"Downloading {blob_path} -> {local_path}")
        bucket.blob(blob_path).download_to_filename(local_path)
        print(f"Done: {local_path}")


if __name__ == "__main__":
    download_model_files()
