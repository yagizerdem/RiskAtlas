import os
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("FLOOD_AI_DATA_DIR", APP_ROOT / "data"))
CACHE_DIR = DATA_DIR / "cache"
DATASET_PATH = DATA_DIR / "dataset.csv"
ARTIFACTS_DIR = Path(os.getenv("FLOOD_AI_ARTIFACTS_DIR", APP_ROOT / "artifacts"))

# Climate history window used for rainfall / soil moisture statistics (NASA POWER)
CLIMATE_START = "20040101"
CLIMATE_END = "20231231"

# Flood event archive window (GDACS)
EVENTS_START_YEAR = 2000
EVENTS_END_YEAR = 2025

# Label: kernel density of observed flood events around a point
EVENT_KERNEL_RADIUS_KM = 75.0
ALERT_WEIGHTS = {"green": 1.0, "orange": 2.0, "red": 3.0}

RANDOM_SEED = 42

API_HOST = os.getenv("FLOOD_AI_HOST", "0.0.0.0")
API_PORT = int(os.getenv("FLOOD_AI_PORT", "5001"))
