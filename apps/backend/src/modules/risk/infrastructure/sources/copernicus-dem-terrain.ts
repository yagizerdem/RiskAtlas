import { injectable } from "tsyringe";
import {
  Coordinates,
  ITerrainSource,
  TerrainSample,
} from "@modules/risk/domain/fire-risk.js";
import { CogReader } from "@modules/risk/infrastructure/raster/cog-reader.js";

const BASE_URL = "https://copernicus-dem-30m.s3.amazonaws.com";
const METERS_PER_DEGREE = 111_320;

/**
 * Overview level 2 (900 px per 1° tile, ≈111 m) — the same grid the burn rates
 * were derived on (scripts/risk/derive-burn-rates.mjs), so slope classes match.
 * It also smooths out buildings: Copernicus is a surface model and at 30 m a
 * flat district (Kemeraltı) read 13.5° from building edges.
 */
const DEM_OVERVIEW = 2;

/** Copernicus DEM GLO-30: 1°×1° tiles named after their south-west corner. */
export function demTileUrl({ lat, lon }: Coordinates): string {
  const latFloor = Math.floor(lat);
  const lonFloor = Math.floor(lon);
  const ns = `${latFloor >= 0 ? "N" : "S"}${String(Math.abs(latFloor)).padStart(2, "0")}_00`;
  const ew = `${lonFloor >= 0 ? "E" : "W"}${String(Math.abs(lonFloor)).padStart(3, "0")}_00`;
  const name = `Copernicus_DSM_COG_10_${ns}_${ew}_DEM`;
  return `${BASE_URL}/${name}/${name}.tif`;
}

/**
 * Slope from a 3×3 elevation window with Horn's method
 * (the one GIS tools such as GDAL and ArcGIS use).
 */
export function hornSlopeDeg(
  z: number[],
  cellXm: number,
  cellYm: number,
): number {
  const [a, b, c, d, , f, g, h, i] = z as [
    number, number, number, number, number, number, number, number, number,
  ];
  const dzdx = (c + 2 * f + i - (a + 2 * d + g)) / (8 * cellXm);
  const dzdy = (g + 2 * h + i - (a + 2 * b + c)) / (8 * cellYm);
  return (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
}

@injectable()
export class CopernicusDemTerrain implements ITerrainSource {
  private readonly reader = new CogReader();

  async sample(point: Coordinates): Promise<TerrainSample> {
    const window = await this.reader.readWindow(
      demTileUrl(point),
      point.lat,
      point.lon,
      3,
      DEM_OVERVIEW,
    );
    // No tile: open sea, or areas Copernicus GLO-30 does not publish
    // (tiles touching Armenia, e.g. parts of Iğdır, Kars, Ardahan)
    if (!window) return { elevationM: null, slopeDeg: null };

    const cellYm = window.resY * METERS_PER_DEGREE;
    const cellXm =
      window.resX * METERS_PER_DEGREE * Math.cos((point.lat * Math.PI) / 180);

    return {
      elevationM: Math.round(window.values[4]! * 10) / 10,
      slopeDeg:
        Math.round(hornSlopeDeg(window.values, cellXm, cellYm) * 10) / 10,
    };
  }
}
