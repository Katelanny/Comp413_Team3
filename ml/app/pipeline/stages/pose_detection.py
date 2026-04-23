import logging

from app.pipeline.types import LesionAnalysis
from app.services.image_loader import LoadedImage
from app.models.pose_model import PoseModel

logger = logging.getLogger(__name__)


# Standard DensePose 24-part mapping
BODY_PART_NAMES = {
    0: "Background",
    1: "Torso Back", 2: "Torso Front", 3: "Right Hand", 4: "Left Hand",
    5: "Left Foot", 6: "Right Foot", 7: "Upper Leg Right Back",
    8: "Upper Leg Left Back", 9: "Upper Leg Right Front", 10: "Upper Leg Left Front",
    11: "Lower Leg Right Back", 12: "Lower Leg Left Back", 13: "Lower Leg Right Front",
    14: "Lower Leg Left Front", 15: "Upper Arm Left Back", 16: "Upper Arm Right Back",
    17: "Upper Arm Left Front", 18: "Upper Arm Right Front", 19: "Lower Arm Left Back",
    20: "Lower Arm Right Back", 21: "Lower Arm Left Front", 22: "Lower Arm Right Front",
    23: "Head Back", 24: "Head Front"
}

def run_pose_detection(
    images: list[LoadedImage],
    lesion_analysis: list[LesionAnalysis],
    pose_model: PoseModel,
) -> list[LesionAnalysis]:
    """
    Runs pose detection on already validated images.

    Assumes:
        - All inputs have image != None
        - All inputs have error == None

    Returns:
        List[PoseResult] aligned with input order
    """

    if not images:
        return lesion_analysis

    try:
        #Should return a list of dictionaries containing 
        # I, U, and V matrices and patient_box [x1, y1, x2, y2]
        pose_results = pose_model.predict(images)
    except Exception as e:
        logger.error(f"Error occurred while running pose detection: {e}")
        return lesion_analysis

    for analysis, dp_result in zip(lesion_analysis, pose_results):

        if not dp_result or dp_result.is_empty:
            continue

        dp_I = dp_result.I_matrix
        dp_U = dp_result.U_matrix
        dp_V = dp_result.V_matrix
        p_x1, p_y1, p_x2, p_y2 = dp_result.patient_box

        # Store person box on analysis for use in temporal matching
        analysis.person_box = (float(p_x1), float(p_y1), float(p_x2), float(p_y2))

        dp_h, dp_w = dp_I.shape
        box_w = p_x2 - p_x1
        box_h = p_y2 - p_y1

        for lesion in analysis.lesions:
            box = lesion.box

            # Calculating center of lesion box from box coordinates
            mx = int((box.x1 + box.x2) / 2)
            my = int((box.y1 + box.y2) / 2)

            # Checking if lesion center is within the person bounding box
            if (p_x1 <= mx <= p_x2) and (p_y1 <= my <= p_y2):

                # Scale pixel offset to DensePose output dimensions.
                # DensePose outputs are at a fixed internal resolution (e.g. 112x112),
                # not at the full bounding-box pixel size, so a direct pixel offset
                # would clamp every lesion to the matrix edge (always "Left Foot").
                lx = int((mx - p_x1) / box_w * dp_w)
                ly = int((my - p_y1) / box_h * dp_h)
                lx = min(max(lx, 0), dp_w - 1)
                ly = min(max(ly, 0), dp_h - 1)

                part_id = int(dp_I[ly, lx])

                # Updating lesion object if location is not background
                if part_id > 0:
                    lesion.anatomical_site = BODY_PART_NAMES.get(part_id, "Unknown")
                    lesion.u_coord = float(dp_U[part_id, ly, lx])
                    lesion.v_coord = float(dp_V[part_id, ly, lx])
                else:
                    lesion.anatomical_site = "Background"
            else:
                lesion.anatomical_site = "Outside Person Bounding Box"

    return lesion_analysis
