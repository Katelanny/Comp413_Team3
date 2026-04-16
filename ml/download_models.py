from google.cloud import storage
import os

def download_model_files():
    client = storage.Client()
    bucket = client.bucket("comp-413-class")

    files = [
        ("models/lesion/config.yaml", "/tmp/lesion_config.yaml"),
        ("models/model.pth", "/tmp/lesion_weights.pth"),
    ]

    for blob_path, local_path in files:
        print(f"Downloading {blob_path} -> {local_path}")
        bucket.blob(blob_path).download_to_filename(local_path)
        print(f"Done: {local_path}")

if __name__ == "__main__":
    download_model_files()