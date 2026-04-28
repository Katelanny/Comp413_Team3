"""
Temporal Lesion Matching and Change Analysis Stage.

This module implements the logic for tracking lesions across multiple 
timepoints. It uses spatial heuristics (Intersection over Union) to 
identify the same lesion in consecutive images, allowing for the 
calculation of longitudinal changes.

Key Logic:
1. Spatial Grouping: Isolates images by camera angle to ensure 
   comparisons only happen between consistent views.
2. Chronological Sorting: Processes images in temporal order.
3. IoU Matching: Uses a greedy matching algorithm based on bounding box 
   overlap to link lesions at time $t$ to lesions at time $t-1$.
4. Growth Metrics: Computes the percentage change in surface area 
   between matched detections.

Note: This stage performs in-place mutation of the Lesion objects 
within the LesionAnalysis containers.
"""

from collections import defaultdict

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

    Groups by camera angle first, then sorts each group by timestamp,
    so matching only happens between consecutive timepoints of the same view.
    """
    groups: dict[str, list[LesionAnalysis]] = defaultdict(list)
    for analysis in lesion_results:
        groups[analysis.camera_angle].append(analysis)

    for group in groups.values():
        group.sort(key=lambda x: x.timestamp)

        for i in range(1, len(group)):
            prev = group[i - 1]
            curr = group[i]

            matched_prev_lesions = set()

            for lesion in curr.lesions:
                best_iou = 0
                best_match = None

                for prev_lesion in prev.lesions:
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
    """
    Calculates the 2D surface area of a bounding box.

    Args:
        box: The BoundingBox containing x1, y1, x2, y2 coordinates.

    Returns:
        float: The area in pixel units squared. Returns 0 for invalid 
               or collapsed boxes.
    """
    return max(0, box.x2 - box.x1) * max(0, box.y2 - box.y1)


def calculate_iou(boxA: BoundingBox, boxB: BoundingBox) -> float:
    """
    Computes the Intersection over Union (IoU) of two bounding boxes.

    IoU is a metric between 0.0 and 1.0 used to measure spatial overlap. 
    A higher value indicates that the boxes are more likely to represent 
    the same physical object.

    The formula used is:
    $$IoU = \frac{Area\ of\ Overlap}{Area\ of\ Union}$$

    Args:
        boxA: First bounding box.
        boxB: Second bounding box.

    Returns:
        float: The overlap ratio (0.0 to 1.0).
    """
    xA = max(boxA.x1, boxB.x1)
    yA = max(boxA.y1, boxB.y1)
    xB = min(boxA.x2, boxB.x2)
    yB = min(boxA.y2, boxB.y2)

    interArea = max(0, xB - xA) * max(0, yB - yA)

    boxAArea = get_area(boxA)
    boxBArea = get_area(boxB)

    iou = interArea / float(boxAArea + boxBArea - interArea) if (boxAArea + boxBArea - interArea) > 0 else 0

    return iou
