"""Feature extraction for a coordinate: terrain (DEM) + climate (rainfall, soil wetness)."""

from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd

from flood_ai.sources import fetch_elevations, fetch_power_daily, snap_to_power_grid

FEATURE_COLUMNS = [
    "elevation",
    "relief_2km",
    "slope_2km",
    "tpi_2km",
    "relief_10km",
    "tpi_10km",
    "precip_annual_mm",
    "precip_max_1d_mm",
    "precip_max_3d_mm",
    "precip_p99_mm",
    "heavy_rain_days",
    "precip_seasonality",
    "soil_wetness_mean",
    "soil_wetness_p90",
]

# (north, east, south, west) offsets for the terrain neighbourhood
_DIRECTIONS = np.array([(1, 0), (0, 1), (-1, 0), (0, -1)], float)
_KM_PER_DEG_LAT = 111.32


def _neighbour_coords(lat: float, lon: float, dist_km: float):
    dlat = dist_km / _KM_PER_DEG_LAT
    dlon = dist_km / (_KM_PER_DEG_LAT * max(np.cos(np.radians(lat)), 0.01))
    return lat + _DIRECTIONS[:, 0] * dlat, lon + _DIRECTIONS[:, 1] * dlon


def terrain_features(lats, lons, *, cache: bool = True) -> pd.DataFrame:
    """Elevation plus local relief / slope / topographic position index at 2 km and 10 km.

    A negative TPI means the point lies lower than its surroundings (valley, basin),
    which is where water accumulates.
    """
    lats, lons = np.asarray(lats, float), np.asarray(lons, float)
    all_lat, all_lon = [lats], [lons]
    for dist in (2.0, 10.0):
        nlat, nlon = zip(*(_neighbour_coords(la, lo, dist) for la, lo in zip(lats, lons)))
        all_lat.append(np.concatenate(nlat))
        all_lon.append(np.concatenate(nlon))
    elev = fetch_elevations(np.concatenate(all_lat), np.concatenate(all_lon), cache=cache)

    n = len(lats)
    center = elev[:n]
    ring2 = elev[n : 5 * n].reshape(n, 4)
    ring10 = elev[5 * n :].reshape(n, 4)
    with_center2 = np.column_stack([center, ring2])
    with_center10 = np.column_stack([center, ring10])
    return pd.DataFrame(
        {
            "elevation": center,
            "relief_2km": with_center2.max(1) - with_center2.min(1),
            "slope_2km": np.degrees(np.arctan(np.abs(ring2 - center[:, None]).mean(1) / 2000.0)),
            "tpi_2km": center - ring2.mean(1),
            "relief_10km": with_center10.max(1) - with_center10.min(1),
            "tpi_10km": center - ring10.mean(1),
        }
    )


def _climate_stats(df: pd.DataFrame) -> dict:
    precip = df["precip"].dropna()
    yearly = precip.groupby(precip.index.year)
    monthly_mean = precip.groupby(precip.index.month).mean()
    return {
        "precip_annual_mm": float(yearly.sum().mean()),
        "precip_max_1d_mm": float(yearly.max().mean()),
        "precip_max_3d_mm": float(precip.rolling(3).sum().groupby(precip.index.year).max().mean()),
        "precip_p99_mm": float(precip.quantile(0.99)),
        "heavy_rain_days": float((precip >= 20).groupby(precip.index.year).sum().mean()),
        "precip_seasonality": float(monthly_mean.std() / monthly_mean.mean()) if monthly_mean.mean() > 0 else 0.0,
        "soil_wetness_mean": float(df["soil_wetness"].mean()),
        "soil_wetness_p90": float(df["soil_wetness"].quantile(0.9)),
    }


def climate_features(lats, lons, *, cache: bool = True, workers: int = 8) -> pd.DataFrame:
    cells = [snap_to_power_grid(la, lo) for la, lo in zip(lats, lons)]
    unique = list(dict.fromkeys(cells))

    def load(cell):
        return cell, _climate_stats(fetch_power_daily(*cell, cache=cache))

    with ThreadPoolExecutor(max_workers=workers) as pool:
        stats = dict(pool.map(load, unique))
    return pd.DataFrame([stats[c] for c in cells])


def build_features(lats, lons, *, cache: bool = True) -> pd.DataFrame:
    terrain = terrain_features(lats, lons, cache=cache)
    climate = climate_features(lats, lons, cache=cache)
    return pd.concat([terrain, climate], axis=1)[FEATURE_COLUMNS]
