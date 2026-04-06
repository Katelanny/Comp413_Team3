from fastapi import FastAPI

from app.api.routes import router


def create_app() -> FastAPI:
    """
    Application factory.
    """
    app = FastAPI(
        title="Lesion Analysis Service",
        description="API for lesion detection, pose estimation, and temporal analysis",
        version="1.0.0",
    )

    # Register routes
    app.include_router(router)

    return app


# Create app instance
app = create_app()