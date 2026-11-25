"""Build the training dataset from public internet data.

Labels come from the GDACS flood event archive: every sample point gets a flood
occurrence intensity computed as a kernel density of nearby observed flood events
(weighted by alert level), mapped to a 1-10 risk score. Features are terrain and
climate statistics fetched for the same point (see ``features.py``).

Sample points are:
- jittered locations of observed flood events (presence samples),
- random land points worldwide (background samples),
- random land points inside a focus bounding box (Turkey by default).
"""

import argparse

import numpy as np
import pandas as pd

from flood_ai.config import (
    ALERT_WEIGHTS,
    DATA_DIR,
    DATASET_PATH,
    EVENT_KERNEL_RADIUS_KM,
    EVENTS_END_YEAR,
    EVENTS_START_YEAR,
    RANDOM_SEED,
)
from flood_ai.features import build_features
from flood_ai.sources import fetch_elevations, fetch_flood_events

EARTH_RADIUS_KM = 6371.0
EVENTS_PATH = DATA_DIR / "flood_events.csv"


def haversine_km(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    a = (
        np.sin((lat2 - lat1) / 2) ** 2
        + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))


def event_intensity(lats, lons, events: pd.DataFrame) -> np.ndarray:
    weights = events["alert"].map(ALERT_WEIGHTS).fillna(1.0).to_numpy()
    dist = haversine_km(
        np.asarray(lats)[:, None],
        np.asarray(lons)[:, None],
        events["lat"].to_numpy()[None, :],
        events["lon"].to_numpy()[None, :],
    )
    return (weights[None, :] * np.exp(-((dist / EVENT_KERNEL_RADIUS_KM) ** 2))).sum(1)


def intensity_to_score(intensity: np.ndarray, half_point: float) -> np.ndarray:
    """Saturating map of event intensity to 1-10 (half_point -> 5.5)."""
    return 1.0 + 9.0 * intensity / (intensity + half_point)


def sample_land_points(rng, n, lat_range, lon_range) -> pd.DataFrame:
    """Uniform-on-sphere points within the box, keeping only land (DEM elevation > 0)."""
    kept = []
    total = 0
    while total < n:
        m = max(3 * (n - total), 100)
        z = rng.uniform(np.sin(np.radians(lat_range[0])), np.sin(np.radians(lat_range[1])), m)
        lats = np.degrees(np.arcsin(z))
        lons = rng.uniform(lon_range[0], lon_range[1], m)
        elev = fetch_elevations(lats, lons, cache=False)
        mask = elev > 0
        kept.append(pd.DataFrame({"lat": lats[mask], "lon": lons[mask]}))
        total += int(mask.sum())
    return pd.concat(kept, ignore_index=True).iloc[:n]


def jitter_points(rng, lats, lons, max_km: float) -> pd.DataFrame:
    dist = max_km * np.sqrt(rng.uniform(0, 1, len(lats)))
    bearing = rng.uniform(0, 2 * np.pi, len(lats))
    dlat = dist * np.cos(bearing) / 111.32
    dlon = dist * np.sin(bearing) / (111.32 * np.maximum(np.cos(np.radians(lats)), 0.01))
    return pd.DataFrame({"lat": lats + dlat, "lon": lons + dlon})


def build_dataset(n_event: int, n_background: int, n_focus: int, focus_bbox) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)

    print(f"[1/4] GDACS flood events {EVENTS_START_YEAR}-{EVENTS_END_YEAR} downloading...")
    events = fetch_flood_events(EVENTS_START_YEAR, EVENTS_END_YEAR)
    events = events[(events["lat"].abs() > 0.01) | (events["lon"].abs() > 0.01)]
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    events.to_csv(EVENTS_PATH, index=False)
    print(f"      {len(events)} events found")

    print("[2/4] Selecting sample points...")
    picked = events.sample(min(n_event, len(events)), random_state=RANDOM_SEED)
    presence = jitter_points(rng, picked["lat"].to_numpy(), picked["lon"].to_numpy(), 20.0)
    presence["source"] = "event"
    background = sample_land_points(rng, n_background, (-56, 72), (-180, 180))
    background["source"] = "background"
    parts = [presence, background]
    if n_focus > 0:
        min_lon, min_lat, max_lon, max_lat = focus_bbox
        focus = sample_land_points(rng, n_focus, (min_lat, max_lat), (min_lon, max_lon))
        focus["source"] = "focus"
        parts.append(focus)
    points = pd.concat(parts, ignore_index=True)
    print(f"      {len(points)} points")

    print("[3/4] Fetching terrain (OpenTopoData DEM) and climate (NASA POWER) features...")
    features = build_features(points["lat"].to_numpy(), points["lon"].to_numpy())

    print("[4/4] Computing labels...")
    intensity = event_intensity(points["lat"], points["lon"], events)
    half_point = float(np.median(intensity[points["source"] == "event"]))
    dataset = pd.concat([points, features], axis=1)
    dataset["event_intensity"] = intensity
    dataset["risk_score"] = intensity_to_score(intensity, half_point)
    dataset = dataset.dropna().reset_index(drop=True)
    dataset.attrs["half_point"] = half_point
    return dataset


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--events", type=int, default=1200, help="flood event (presence) samples")
    parser.add_argument("--background", type=int, default=1000, help="random worldwide land samples")
    parser.add_argument("--focus", type=int, default=400, help="random samples inside --focus-bbox")
    parser.add_argument(
        "--focus-bbox",
        type=float,
        nargs=4,
        default=(25.6, 35.8, 44.8, 42.1),
        metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"),
        help="default: Turkey",
    )
    args = parser.parse_args()

    dataset = build_dataset(args.events, args.background, args.focus, args.focus_bbox)
    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(DATASET_PATH, index=False)
    print(f"Dataset saved: {DATASET_PATH} ({len(dataset)} rows)")
    print(dataset["risk_score"].describe().round(2).to_string())


if __name__ == "__main__":
    main()
