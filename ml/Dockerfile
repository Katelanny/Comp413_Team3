FROM python:3.11-slim

# Install system dependencies required by OpenCV and Detectron2
RUN apt-get update && apt-get install -y \
    git \
    python3-dev \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install requirements first (layer caching)
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Detectron2 from source (requires torch to be installed first)
RUN pip install --no-build-isolation \
    'git+https://github.com/facebookresearch/detectron2.git'

# Install GCS client
RUN pip install google-cloud-storage

# Copy app code and download script
COPY app/ ./app/
COPY download_models.py .

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]