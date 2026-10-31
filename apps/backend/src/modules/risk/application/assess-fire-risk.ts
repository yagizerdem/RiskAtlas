import { inject, injectable } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import {
  Coordinates,
  FireRiskAssessment,
  IFireWeatherSource,
  ILandCoverSource,
  ITerrainSource,
} from "@modules/risk/domain/fire-risk.js";
import {
  burnRatio,
  structuralLevel,
  WORLD_COVER_LABELS,
} from "@modules/risk/domain/burn-rates.js";

/**
 * Two separate answers for a point:
 * - structural: how often this land cover × slope burned in Turkey (real burnt areas)
 * - weather: the fire weather danger of the day (Canadian FWI, EFFIS classes)
 * They are not merged into one number: no calibrated link between the two exists yet.
 */
@injectable()
export class AssessFireRisk {
  constructor(
    @inject(TOKENS.TerrainSource) private readonly terrain: ITerrainSource,
    @inject(TOKENS.LandCoverSource)
    private readonly landCover: ILandCoverSource,
    @inject(TOKENS.FireWeatherSource)
    private readonly fireWeather: IFireWeatherSource,
  ) {}

  async execute(
    point: Coordinates,
    date?: string,
  ): Promise<FireRiskAssessment> {
    const [terrain, cover, weather] = await Promise.all([
      this.terrain.sample(point),
      this.landCover.sample(point),
      this.fireWeather.sample(point, date),
    ]);

    const ratio = burnRatio(cover.worldCoverClass, terrain.slopeDeg);
    const slopePct =
      terrain.slopeDeg === null
        ? null
        : Math.round(Math.tan((terrain.slopeDeg * Math.PI) / 180) * 1000) / 10;

    return {
      location: point,
      structural: {
        burnRatio: ratio === null ? null : Math.round(ratio * 100) / 100,
        level: ratio === null ? null : structuralLevel(ratio),
        landCover: {
          ...cover,
          label: WORLD_COVER_LABELS[cover.worldCoverClass] ?? "Unknown",
        },
        terrain: { ...terrain, slopePct },
      },
      weather: weather
        ? { available: true, ...weather }
        : { available: false, reason: "Fire weather unavailable for this day" },
    };
  }
}
