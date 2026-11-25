"""Clients for the public data sources used by the model.

- OpenTopoData API (Mapzen global DEM, with bathymetry) -> terrain
- NASA POWER daily point API (MERRA-2 based)            -> rainfall and soil wetness
- GDACS event API                                        -> observed flood events (labels)
"""

import threading
import time

import numpy as np
import pandas as pd

from flood_ai.config import CLIMATE_END, CLIMATE_START
from flood_ai.http import get_json

ELEVATION_URL = "https://api.opentopodata.org/v1/mapzen"
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
GDACS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"

ELEVATION_BATCH = 100
ELEVATION_MIN_INTERVAL_S = 1.05  # public OpenTopoData limit: 1 request per second
POWER_GRID_DEG = 0.5  # native MERRA-2 resolution, used to dedupe requests


_elevation_lock = threading.Lock()
_last_elevation_request = 0.0


def _throttle_elevation():
    global _last_elevation_request
    with _elevation_lock:
        wait = _last_elevation_request + ELEVATION_MIN_INTERVAL_S - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_elevation_request = time.monotonic()


def fetch_elevations(lats, lons, *, cache: bool = True) -> np.ndarray:
    """Elevation in metres; ocean points are negative (bathymetry)."""
    lats, lons = np.asarray(lats, float), np.asarray(lons, float)
    out = np.empty(len(lats))
    for start in range(0, len(lats), ELEVATION_BATCH):
        sl = slice(start, start + ELEVATION_BATCH)
        params = {
            "locations": "|".join(f"{la:.5f},{lo:.5f}" for la, lo in zip(lats[sl], lons[sl])),
        }
        data = get_json(ELEVATION_URL, params, cache=cache, before_request=_throttle_elevation)
        out[sl] = [np.nan if r["elevation"] is None else r["elevation"] for r in data["results"]]
    return out


def snap_to_power_grid(lat: float, lon: float) -> tuple[float, float]:
    return (
        round(round(lat / POWER_GRID_DEG) * POWER_GRID_DEG, 2),
        round(round(lon / POWER_GRID_DEG) * POWER_GRID_DEG, 2),
    )


def fetch_power_daily(lat: float, lon: float, *, cache: bool = True) -> pd.DataFrame:
    """Daily precipitation (mm/day) and root zone soil wetness (0-1)."""
    lat, lon = snap_to_power_grid(lat, lon)
    data = get_json(
        NASA_POWER_URL,
        {
            "parameters": "PRECTOTCORR,GWETROOT",
            "community": "AG",
            "latitude": lat,
            "longitude": lon,
            "start": CLIMATE_START,
            "end": CLIMATE_END,
            "format": "JSON",
        },
        cache=cache,
        timeout=120,
    )
    params = data["properties"]["parameter"]
    fill = data.get("header", {}).get("fill_value", -999.0)
    df = pd.DataFrame(
        {
            "precip": pd.Series(params["PRECTOTCORR"]),
            "soil_wetness": pd.Series(params["GWETROOT"]),
        }
    )
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    return df.replace(fill, np.nan).astype(float)


def fetch_flood_events(start_year: int, end_year: int) -> pd.DataFrame:
    rows = []
    for year in range(start_year, end_year + 1):
        page = 1
        while True:
            data = get_json(
                GDACS_URL,
                {
                    "eventlist": "FL",
                    "alertlevel": "Green;Orange;Red",
                    "fromdate": f"{year}-01-01",
                    "todate": f"{year}-12-31",
                    "pagesize": 100,
                    "pagenumber": page,
                },
            )
            features = (data or {}).get("features") or []
            for feature in features:
                lon, lat = feature["geometry"]["coordinates"][:2]
                props = feature["properties"]
                rows.append(
                    {
                        "event_id": props.get("eventid"),
                        "lat": float(lat),
                        "lon": float(lon),
                        "alert": str(props.get("alertlevel", "green")).lower(),
                        "country": props.get("country"),
                        "from_date": props.get("fromdate"),
                    }
                )
            if len(features) < 100:
                break
            page += 1
    return pd.DataFrame(rows).drop_duplicates("event_id").reset_index(drop=True)
