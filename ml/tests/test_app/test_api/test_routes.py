def test_predict_success(client, mock_pipeline, valid_payload):
    mock_pipeline.return_value = (
        [
            {
                "img_id": "img_1",
                "timestamp": "2024-01-01T00:00:00Z",
                "num_lesions": 1,
                "lesions": [
                    {
                        "lesion_id": "lesion_1",
                        "box": {
                            "x1": 0.0,
                            "y1": 0.0,
                            "x2": 1.0,
                            "y2": 1.0
                        },
                        "score": 0.9,
                        "polygon_mask": [[0.0, 0.0], [1.0, 1.0]],
                        "u_coord": None,
                        "v_coord": None,
                        "anatomical_site": None,
                        "prev_lesion_id": None,
                        "relative_size_change": None
                    }
                ]
            }
        ],
        []
    )

    response = client.post("/predict", json=valid_payload)


    assert response.status_code == 200

def test_pipeline_called_with_correct_args(client, mock_pipeline, valid_payload):
    mock_pipeline.return_value = (
        [
            {
                "img_id": "img_1",
                "timestamp": "2024-01-01T00:00:00Z",
                "num_lesions": 0,
                "lesions": []
            }
        ],
        []
    )

    response = client.post("/predict", json=valid_payload)

    mock_pipeline.assert_called_once()

    args, kwargs = mock_pipeline.call_args
    images, lesion_model, pose_model = args

    assert isinstance(images, list)
    assert lesion_model is not None
    assert pose_model is not None

def test_predict_invalid_payload(client):
    bad_payload = {
        "patient_id": "123",
        "images": [
            {
                "url": "missing_timestamp"
            }
        ]
    }

    response = client.post("/predict", json=bad_payload)

    assert response.status_code == 422
def test_predict_with_errors(client, mock_pipeline, valid_payload):
    mock_pipeline.return_value = (
        [],
        [
            {
                "img_id": "img_1",
                "timestamp": "2024-01-01T00:00:00Z",
                "error": "failed to load"
            }
        ]
    )

    response = client.post("/predict", json=valid_payload)

    assert response.status_code == 200

    data = response.json()
    assert data["predictions"] == []
    assert len(data["errors"]) == 1

def test_missing_models(client, mock_pipeline, valid_payload):
    client.app.state.lesion_model = None
    client.app.state.pose_model = None

    mock_pipeline.return_value = ([], [])

    response = client.post("/predict", json=valid_payload)

    assert response.status_code in (200, 500)