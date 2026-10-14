"""ChurnIQ Backend Package."""

import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'import app...' works from any working directory
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
