### POST `/predict`

#### Request Body (JSON Schema)
```yaml
PredictRequest:
  type: object
  required:
    - patient_id
    - images_by_timepoints

  properties:
    patient_id:
      type: string

    images_by_timepoints:
      type: array
      description: Each index corresponds to a timepoint
      items:
        type: array
        description: List of image URLs at a timepoint
        items:
          type: string
          format: uri

PredictResponse:
  type: object
  required:
    - patient_id
    - predictions_by_timepoints

  properties:
    patient_id:
      type: string
    
    predictions_by_timepoints:
        type: array
        description: Each index corresponds to a timepoint
        items:
            type: array
            description: List of image predictions at a timepoint
            items: 
                type: object
                required: 
                    - num_lesions
                    - input_image_url
                    - prediction_image_url
                    - lesions
                
                properties:
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
                            - id
                            - box
                            - score
                            - polygon_mask
                            - anatomical_site

                            properties:
                            lesion_id:
                                type: string
                                description: "{patient_id}_{timestamp}_{index}"

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
                                description: Lesion ID from the previous timepoint (t-1) that matches this lesion; null if no match exists
                            
                            relative_size_change:
                                type: number
                                format: float
                                nullable: true
                                description: Relative change in lesion size compared to previous timepoint (t-1). 
                                Example: 0.2 = +20% growth, -0.1 = -10% shrinkage. 
                                Null if no previous matched lesion exists.
```