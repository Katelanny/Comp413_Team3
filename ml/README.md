```text
app/
├── main.py                       # App entry point & FastAPI init
├── api/
│   └── routes.py                 # API endpoints & validation
├── models/
│   ├── lesion_model.py           # Lesion detection wrapper
│   └── pose_model.py             # Pose detection wrapper
├── pipeline/
│   ├── pipeline.py               # Workflow orchestrator
│   ├── types.py                  # Shared data structures
│   └── stages/
│       ├── lesion_detection.py    # Lesion processing logic
│       ├── pose_detection.py      # Pose processing logic
│       └── lesion_matching_by_time.py  # Temporal matching logic
└── services/
    └── image_loader.py           # Async image downloading```
```

# Application Architecture

- **app/main.py**
  Entry point of the application. Initializes the FastAPI app, loads ML models at startup, and registers API routes.

- **app/api/routes.py**
  Defines API endpoints (e.g., `POST /predict`), validates incoming requests, and invokes the pipeline.

- **app/models/lesion_model.py**
  Wrapper for the lesion detection model (Detectron2). Handles model loading and exposes a `predict()` interface.

- **app/models/pose_model.py**
  Wrapper for the pose detection model (Detectron2). Provides a consistent `predict()` interface for keypoint detection.

- **app/pipeline/pipeline.py**
  Coordinates the full workflow:
  1. Download images
  2. Run lesion detection
  3. Run pose detection
  4. Perform temporal alignment
  5. Return structured predictions

- **app/pipeline/types.py**
  Defines shared internal data structures used across pipeline stages (e.g., image data, lesion results, pose results).

- **app/pipeline/stages/lesion_detection.py**
  Runs lesion detection on input images and converts raw model outputs into structured lesion data.

- **app/pipeline/stages/pose_detection.py**
  Runs pose detection and produces structured keypoint data per image.

- **app/pipeline/stages/lesion_matching_by_time.py**
  Implements deterministic logic to match lesions across consecutive timepoints and compute changes over time.

- **app/services/image_loader.py**
  Handles downloading images from URLs (async), decoding them, and preparing them for model inference.

### POST `/predict`

#### Request Body (JSON Schema)
```yaml
PredictRequest:
  type: object
  required:
    - patient_id
    - images

  properties:
    patient_id:
      type: string

    images:
      type: array
      description: Flat list of images with timestamps
      items:
        type: object
        required:
          - url
          - timestamp
        properties:
          url:
            type: string
            format: uri
          timestamp:
            type: string
            format: date-time

PredictResponse:
  type: object
  required:
    - patient_id
    - predictions

  properties:
    patient_id:
      type: string
    
    predictions:
        type: array
        description: Flat list of results of lesion analysis per image
        items: 
            type: object
            required: 
                - timestamp
                - num_lesions
                - input_image_url
                - prediction_image_url
                - lesions
            
            properties:
                timestamp:
                  type: string
                  format: date-time

                num_lesions:
                    type: integer
                
                input_image_url:
                    type: string

                prediction_image_url:
                    type: string
                    format: uri
                    description: URL to image with model predictions overlaid

                lesions:
                    type: array
                    items:
                        type: object
                        required:
                            - lesion_id
                            - box
                            - score
                            - polygon_mask
                            - anatomical_site

                        properties:
                        lesion_id:
                            type: string
                            description: "{patient_id}_{time}_{index}"

                        box:
                            type: object
                            required: [x1, y1, x2, y2]
                            properties:
                            x1: { type: number, format: float }
                            y1: { type: number, format: float }
                            x2: { type: number, format: float }
                            y2: { type: number, format: float }
                            description: Bounding box in pixel coordinates

                        score:
                            type: number
                            format: float
                            minimum: 0.0
                            maximum: 1.0
                            description: Confidence score

                        polygon_mask:
                            type: array
                            description: List of polygon contours (each contour is a flat list of [x1, y1, x2, y2, ...])
                            items:
                            type: array
                            items:
                                type: number
                                format: float
                        
                        anatomical_site:
                            type: string
                        
                        prev_lesion_id:
                            type: string
                            nullable: true
                            description: Lesion ID from the previous time (t-1) that matches this lesion; null if no match exists
                        
                        relative_size_change:
                            type: number
                            format: float
                            nullable: true
                            description: Relative change in lesion size compared to previous time (t-1). 
                            Example: 0.2 = +20% growth, -0.1 = -10% shrinkage. 
                            Null if no previous matched lesion exists.
    ```