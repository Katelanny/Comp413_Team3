from datetime import datetime

from app.pipeline.stages.lesion_matching_by_time import (
    run_lesion_matching_by_time
)
from app.pipeline.types import LesionAnalysis, Lesion, BoundingBox


def make_box(x1, y1, x2, y2):
    return BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)


def make_lesion(lesion_id, box):
    return Lesion(
        lesion_id=lesion_id,
        box=box,
        score=0.9,
        polygon_mask=[],
    )


def make_analysis(angle, ts, lesions):
    return LesionAnalysis(
        img_id=f"{angle}_{ts}",
        timestamp=ts,
        camera_angle=angle,
        lesions=lesions,
    )



def test_matching_and_size_change():

    t1 = datetime(2024, 1, 1, 0, 0, 0)
    t2 = datetime(2024, 1, 2, 0, 0, 0)

    # same lesion shifts slightly and grows
    prev_lesion = make_lesion(
        "l1",
        make_box(10, 10, 20, 20)  # area = 100
    )

    curr_lesion = make_lesion(
        "l2",
        make_box(11, 11, 22, 22)  # area = 121
    )

    prev = make_analysis("front", t1, [prev_lesion])
    curr = make_analysis("front", t2, [curr_lesion])

    run_lesion_matching_by_time([prev, curr])

    assert curr.lesions[0].prev_lesion_id == "l1"

    # (121 - 100) / 100 = 0.21
    assert abs(curr.lesions[0].relative_size_change - 0.21) < 1e-6


def test_no_match_when_far_apart():

    t1 = datetime(2024, 1, 1)
    t2 = datetime(2024, 1, 2)

    prev = make_analysis(
        "front",
        t1,
        [make_lesion("l1", make_box(0, 0, 10, 10))]
    )

    curr = make_analysis(
        "front",
        t2,
        [make_lesion("l2", make_box(100, 100, 110, 110))]
    )

    run_lesion_matching_by_time([prev, curr])

    assert curr.lesions[0].prev_lesion_id is None
    assert curr.lesions[0].relative_size_change is None


def test_camera_angle_isolated():

    t1 = datetime(2024, 1, 1)
    t2 = datetime(2024, 1, 2)

    prev = make_analysis(
        "front",
        t1,
        [make_lesion("l1", make_box(10, 10, 20, 20))]
    )

    curr = make_analysis(
        "side",
        t2,
        [make_lesion("l2", make_box(10, 10, 20, 20))]
    )

    run_lesion_matching_by_time([prev, curr])

    assert curr.lesions[0].prev_lesion_id is None