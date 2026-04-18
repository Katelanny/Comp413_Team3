from app.pipeline.types import LesionAnalysis
from app.services.image_loader import LoadedImage
from app.models.pose_model import PoseModel


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
        pose_results = pose_model.predict(
            images
        )
    except Exception as e:
        print(f"Error occurred while running pose detection: {e}")  
        return lesion_analysis


    # TODO: combine info from pose_result to fill in the anatomical site in lesion_result
    for analysis, dp_result in zip(lesion_analysis, pose_results):
        
        # If no human detected, skip
        if not dp_result or dp_result.is_empty:
            continue

        dp_I = dp_result.I_matrix
        dp_U = dp_result.U_matrix
        dp_V = dp_result.V_matrix
        p_x1, p_y1, p_x2, p_y2 = dp_result.patient_box

        #Iterating through every lesion found in lesion detection stage
        for lesion in analysis.lesions:
            box = lesion.box

            #Calculating center of lesion
            mx = int((box.x1 + box.x2) / 2)
            my = int((box.y1 + box.y2) / 2)

            # Ensuring lesion falls inside human bounding box
            if (p_x1 <= mx <= p_x2) and (p_y1 <= my <= p_y2):

                # Mapping global image pixel to DensePose matrix coordinates
                lx = min(max(int(mx-p_x1), 0), dp_I.shape[1]-1)
                ly = min(max(int(my-p_y1), 0), dp_I.shape[0]-1)

                part_id = int(dp_I[ly, lx])

                # If part is not in background, update lesion object
                if part_id > 0:
                    lesion.anatomical_site = BODY_PART_NAMES.get(part_id, "Unknown")
                    lesion.u_coord = float(dp_U[part_id, ly, lx])
                    lesion.v_coord = float(dp_V[part_id, ly, lx])
                else:
                    lesion.anatomical_site = "Background"
            else:
                lesion.anatomical_site = "Outside Person Bounding Box"

    return lesion_analysis

    
