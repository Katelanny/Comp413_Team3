import numpy as np
from unittest.mock import MagicMock

from app.pipeline.stages.pose_detection import run_pose_detection
from app.pipeline.types import LoadedImage, LesionAnalysis, Lesion, BoundingBox


def make_loaded_image():
    return LoadedImage(
        img_id="img_1",
        timestamp="2024-01-01T00:00:00Z",
        camera_angle="0.0",
        image=np.zeros((100, 100, 3)),
    )


def make_lesion():
    return Lesion(
        lesion_id="l1",
        box=BoundingBox(x1=40, y1=40, x2=60, y2=60),
        score=0.9,
        polygon_mask=[],
    )


def make_analysis():
    return LesionAnalysis(
        img_id="img_1",
        timestamp="2024-01-01T00:00:00Z",
        camera_angle="0.0",
        lesions=[make_lesion()],
    )



def test_pose_detection_updates_lesion(monkeypatch):

    images = [make_loaded_image()]
    analysis = [make_analysis()]

    # DensePose output
    dp_I = np.ones((10, 10))  
    dp_U = np.zeros((25, 10, 10))
    dp_V = np.zeros((25, 10, 10))
    dp_U[1] = 0.5
    dp_V[1] = 0.6

    pose_result = MagicMock()
    pose_result.is_empty = False
    pose_result.patient_box = np.array([30, 30, 80, 80])
    pose_result.I_matrix = dp_I
    pose_result.U_matrix = dp_U
    pose_result.V_matrix = dp_V

    pose_model = MagicMock()
    pose_model.predict.return_value = [pose_result]

    result = run_pose_detection(images, analysis, pose_model)

    assert len(result) == 1

    lesion = result[0].lesions[0]

    assert lesion.anatomical_site is not None
    assert lesion.anatomical_site != "Outside Person Bounding Box"
    assert lesion.u_coord == 0.5
    assert lesion.v_coord == 0.6
    assert result[0].person_box == (30.0, 30.0, 80.0, 80.0)


def test_pose_detection_empty_passthrough(monkeypatch):

    images = []
    analysis = [make_analysis()]

    pose_model = MagicMock()

    result = run_pose_detection(images, analysis, pose_model)

    assert result == analysis