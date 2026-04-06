def run_lesion_detection(images_by_time):
    for time in range(len(images_by_time)):
        for image_url in images_by_time[time]:
            run_lesion_detection_on_image(image_url, time)
        pass


def run_lesion_detection_on_image(image_url: str, time: int):
    pass


def run_pose_detection(predictions_by_time):
    pass


def run_lesion_matching_across_time(predictions_by_time):
    pass
