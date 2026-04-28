"""
Configuration Management Module.

This module defines the schema for application settings and environment variables 
using Pydantic's BaseSettings. It provides a centralized, type-safe way to 
manage model paths, API metadata, and execution modes.

Key Features:
- Environment Variable Overrides: Automatically maps shell environment variables 
  (e.g., APP_NAME) to class attributes.
- Local Development Support: Loads configurations from a `.env` file if present.
- Model Configuration: Centralizes paths for Detectron2 config files and weight 
  checkpoints (.pth) for both Lesion and Pose models.
- Singleton Pattern: Exports a single `settings` instance to ensure consistent 
  configuration across the entire FastAPI lifecycle.
"""

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