"""
Configuration Settings for ChurnIQ Backend API.
"""

from pathlib import Path
from typing import List
import os


def _resolve_artifacts_dir(base: Path) -> Path:
    explicit = os.getenv("ARTIFACTS_DIR")
    if explicit and Path(explicit).exists():
        return Path(explicit)
    candidates = [
        base / "ml" / "artifacts",
        Path.cwd() / "ml" / "artifacts",
        Path.cwd().parent / "ml" / "artifacts",
        Path(__file__).resolve().parents[2] / "ml" / "artifacts",
        Path(__file__).resolve().parents[1] / "ml" / "artifacts",
    ]
    for c in candidates:
        if (c / "churn_model.joblib").exists():
            return c.resolve()
    return (base / "ml" / "artifacts").resolve()


class Settings:
    PROJECT_NAME: str = "ChurnIQ — Customer Retention Intelligence API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Path to ML artifacts (searches BASE_DIR, CWD, and parent directories)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ARTIFACTS_DIR: Path = _resolve_artifacts_dir(BASE_DIR)
    
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
