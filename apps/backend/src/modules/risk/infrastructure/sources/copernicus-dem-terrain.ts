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
 * Copernicus is a surface model: buildings and trees count as terrain, so a
 * 30 m neighbourhood turns building edges into fake slopes (flat Kemeraltı
 * read 13.5°). Sampling neighbours 3 pixels (~90 m) away keeps real slopes
 * (Bozdağ ~13°) while flat city points drop to 0-4°.
 */
const NEIGHBOUR_STEP = 3;
const WINDOW_SIZE = 2 * NEIGHBOUR_STEP + 1;

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
      WINDOW_SIZE,
    );
    // No tile means open sea: flat, no elevation
    if (!window) return { elevationM: null, slopeDeg: 0 };

    const cellXm =
      window.resX *
      NEIGHBOUR_STEP *
      METERS_PER_DEGREE *
      Math.cos((point.lat * Math.PI) / 180);
    const cellYm = window.resY * NEIGHBOUR_STEP * METERS_PER_DEGREE;

    // corners, edge midpoints and centre of the 7×7 window, row by row
    const at = (row: number, col: number) =>
      window.values[row * WINDOW_SIZE + col]!;
    const s = NEIGHBOUR_STEP;
    const ring = [0, s, 2 * s].flatMap((row) =>
      [0, s, 2 * s].map((col) => at(row, col)),
    );

    return {
      elevationM: Math.round(at(s, s) * 10) / 10,
      slopeDeg: Math.round(hornSlopeDeg(ring, cellXm, cellYm) * 10) / 10,
    };
  }
}
