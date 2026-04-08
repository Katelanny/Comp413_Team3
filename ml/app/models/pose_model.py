from app.pipeline.types import LoadedImage, PoseResult


class PoseModel:
    def __init__(self, config_path: str, weights_path: str):
        """
        Initialize pose detection model.

        Args:
            config_path: Path to model config file
            weights_path: Path to model weights
        """
        # TODO: load model (e.g., Detectron2 or other)
        # raise NotImplementedError("Pose model initialization not implemented")

    def predict(
        self,
        images: list[LoadedImage],
    ) -> list[PoseResult]:
        """
        Run pose detection on a batch of images.

        Args:
            images: list of LoadedImage

        Returns:
            list[PoseResult]
        """

        # TODO:
        # raise NotImplementedError("Pose prediction not implemented")
