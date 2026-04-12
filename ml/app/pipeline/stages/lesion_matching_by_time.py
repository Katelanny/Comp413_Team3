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

        matched_prev_lesions = set()

        for lesion in curr.lesions:
            best_iou = 0
            best_match = None
            iou_threshold = 0.3

            for prev_lesion in prev.lesions:
                if prev_lesion.anatomical_site != lesion.anatomical_site:
                    continue
                if prev_lesion.lesion_id in matched_prev_lesions:
                    continue

                iou = calculate_iou(lesion.box, prev_lesion.box)

                if iou > best_iou:
                    best_iou = iou
                    best_match = prev_lesion
                
            if best_iou >= iou_threshold and best_match and best_match.lesion_id not in matched_prev_lesions:
                lesion.prev_lesion_id = best_match.lesion_id

                area_prev = get_area(best_match.box)
                area_curr = get_area(lesion.box)

                if area_prev > 0:
                    lesion.relative_size_change = (area_curr - area_prev) / area_prev


def get_area(box: BoundingBox) -> float:
    return max(0, box.x2 - box.x1) * max(0, box.y2 - box.y1)

def calculate_iou(boxA: BoundingBox, boxB: BoundingBox) -> float:
    xA = max(boxA.x1, boxB.x1)
    yA = max(boxA.y1, boxB.y1)
    xB = min(boxA.x2, boxB.x2)
    yB = min(boxA.y2, boxB.y2)

    interArea = max(0, xB - xA) * max(0, yB - yA)

    boxAArea = (boxA.x2 - boxA.x1) * (boxA.y2 - boxA.y1)
    boxBArea = (boxB.x2 - boxB.x1) * (boxB.y2 - boxB.y1)

    iou = interArea / float(boxAArea + boxBArea - interArea) if (boxAArea + boxBArea - interArea) > 0 else 0

    return iou



# # small test case
# from app.pipeline.types import BoundingBox, Lesion, LesionAnalysis

# t1 = datetime(2024, 1, 1)
# t2 = datetime(2024, 2, 1)

# lesion_t1 = Lesion(
#     lesion_id="scan_jan_0",
#     box=BoundingBox(x1=100, y1=100, x2=150, y2=150),
#     score=0.95,
#     polygon_mask=[],
#     anatomical_site="upper_back"
# )


# lesion_t2_matched = Lesion(
#     lesion_id="scan_feb_0",
#     box=BoundingBox(x1=105, y1=105, x2=165, y2=165),
#     score=0.92,
#     polygon_mask=[],
#     anatomical_site="upper_back"
# )

# lesion_t2_new = Lesion(
#     lesion_id="scan_feb_1",
#     box=BoundingBox(x1=500, y1=500, x2=520, y2=520),
#     score=0.88,
#     polygon_mask=[],
#     anatomical_site="lower_back"
# )

# analysis_list = [
#     LesionAnalysis(img_id="feb_scan", timestamp=t2, view="back", lesions=[lesion_t2_matched, lesion_t2_new]),
#     LesionAnalysis(img_id="jan_scan", timestamp=t1, view="back", lesions=[lesion_t1]),
# ]

# run_lesion_matching_by_time(analysis_list)


# for analysis in analysis_list:
#     print(f"\nImage ID: {analysis.img_id} ({analysis.timestamp.date()})")
#     for l in analysis.lesions:
#         print(f"  - Lesion: {l.lesion_id}")
#         print(f"    Match ID: {l.prev_lesion_id}")
#         print(f"    Size Change: {f'{l.relative_size_change:.2%}' if l.relative_size_change else 'N/A'}")