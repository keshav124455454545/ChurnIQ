"""
Configuration Settings for ChurnIQ Backend API.
"""

from pathlib import Path
from typing import List
import os


class Settings:
    PROJECT_NAME: str = "ChurnIQ — Customer Retention Intelligence API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Path to ML artifacts
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ARTIFACTS_DIR: Path = Path(os.getenv("ARTIFACTS_DIR", str(BASE_DIR / "ml" / "artifacts")))
    
    # Batch processing limits
    MAX_BATCH_SIZE: int = int(os.getenv("MAX_BATCH_SIZE", "500"))
    
    # CORS Origins
    _raw_cors = os.getenv("CORS_ORIGINS", "*")
    CORS_ORIGINS: List[str] = (
        ["*"]
        if _raw_cors == "*"
        else [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]
    )


settings = Settings()
