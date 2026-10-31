import { injectable } from "tsyringe";
import {
  Coordinates,
  ILandCoverSource,
  LandCoverSample,
} from "@modules/risk/domain/fire-risk.js";
import { CogReader } from "@modules/risk/infrastructure/raster/cog-reader.js";

const BASE_URL =
  "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map";

/**
 * Overview level 4 (2250 px per 3° tile, ≈148 m) — the same grid the burn rates
 * were derived on (scripts/risk/derive-burn-rates.mjs).
 */
const WORLD_COVER_OVERVIEW = 4;
const WATER_CLASS = 80;

/** ESA WorldCover 2021: 3°×3° tiles named after their south-west corner. */
export function worldCoverTileUrl({ lat, lon }: Coordinates): string {
  const latFloor = Math.floor(lat / 3) * 3;
  const lonFloor = Math.floor(lon / 3) * 3;
  const ns = `${latFloor >= 0 ? "N" : "S"}${String(Math.abs(latFloor)).padStart(2, "0")}`;
  const ew = `${lonFloor >= 0 ? "E" : "W"}${String(Math.abs(lonFloor)).padStart(3, "0")}`;
  return `${BASE_URL}/ESA_WorldCover_10m_2021_v200_${ns}${ew}_Map.tif`;
}

@injectable()
export class EsaWorldCoverLandCover implements ILandCoverSource {
  private readonly reader = new CogReader();

  async sample(point: Coordinates): Promise<LandCoverSample> {
    const window = await this.reader.readWindow(
      worldCoverTileUrl(point),
      point.lat,
      point.lon,
      1,
      WORLD_COVER_OVERVIEW,
    );
    const value = window?.values[0] ?? 0;
    // 0 = no data, which is open sea; missing tile = open ocean
    return { worldCoverClass: value === 0 ? WATER_CLASS : value };
  }
}
