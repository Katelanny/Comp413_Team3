from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- Lesion Model Settings ---
    # Defaults are set for local development relative paths
    lesion_config_path: str = "models/lesion/config.yaml"
    lesion_weights_path: str = "models/lesion/model_final.pth"
    
    # --- Pose Model Settings ---
    pose_config_path: str = "models/pose/config.yaml"
    pose_weights_path: str = "models/pose/model_final.pth"

    # --- App Configuration ---
    app_name: str = "ML-Service"
    debug: bool = False

    # This configuration tells Pydantic to:
    # 1. Read a .env file if it exists
    # 2. Allow environment variables to override everything
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore" # Ignores extra env vars you might have
    )

# Create a singleton instance to be used across the app
settings = Settings()