from typing import List

from app.pipeline.types import LesionResult


def run_lesion_matching_by_time(
    lesion_results: List[LesionResult],
) -> List[LesionResult]:
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
    raise NotImplementedError("Lesion matching by time not implemented")