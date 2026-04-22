from datetime import datetime

from app.pipeline.types import BoundingBox, LesionAnalysis


def run_lesion_matching_by_time(
    lesion_results: list[LesionAnalysis],
) -> None:
    """
    Performs temporal alignment of lesions across timepoints.

    For each image:
        - Matches lesions to those from the previous timepoint (t-1)
        - Updates:
            - lesion.prev_lesion_id
            - lesion.relative_size_change

    Assumes:
        - lesion_results are from the same patient
        - each LesionResult has a valid timestamp
        - inputs may not be sorted by time

    Behavior:
        - Sorts results by timestamp internally
        - Performs matching between consecutive timepoints only

    Returns:
        List[LesionResult] with updated lesion fields (same objects, mutated)
    """
    lesion_results.sort(key=lambda x: x.timestamp)
    for i in range(1, len(lesion_results)):
        prev = lesion_results[i-1]
        curr = lesion_results[i]

        # if prev.camera_angle != curr.camera_angle:
        #     continue

        matched_prev_lesions = set()

        for lesion in curr.lesions:
            best_iou = 0
            best_match = None
            # iou_threshold = 0.3

            for prev_lesion in prev.lesions:
                # if prev_lesion.anatomical_site != lesion.anatomical_site:
                #     continue
                if prev_lesion.lesion_id in matched_prev_lesions:
                    continue

                iou = calculate_iou(lesion.box, prev_lesion.box)

                if iou > best_iou:
                    best_iou = iou
                    best_match = prev_lesion
                
            if best_match:
                lesion.prev_lesion_id = best_match.lesion_id
                matched_prev_lesions.add(best_match.lesion_id)

                area_prev = get_area(best_match.box)
                area_curr = get_area(lesion.box)

                if area_prev > 0:
                    lesion.relative_size_change = (area_curr - area_prev) / area_prev
                else:
                    lesion.relative_size_change = 0.0
            else:
                lesion.prev_lesion_id = None
                lesion.relative_size_change = None


def get_area(box: BoundingBox) -> float:
    return max(0, box.x2 - box.x1) * max(0, box.y2 - box.y1)

def calculate_iou(boxA: BoundingBox, boxB: BoundingBox) -> float:
    xA = max(boxA.x1, boxB.x1)
    yA = max(boxA.y1, boxB.y1)
    xB = min(boxA.x2, boxB.x2)
    yB = min(boxA.y2, boxB.y2)

    interArea = max(0, xB - xA) * max(0, yB - yA)

    boxAArea = get_area(boxA)
    boxBArea = get_area(boxB)

    iou = interArea / float(boxAArea + boxBArea - interArea) if (boxAArea + boxBArea - interArea) > 0 else 0

    return iou


