import { inject, injectable } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import {
  Coordinates,
  FireRiskAssessment,
  IFireWeatherSource,
  ILandCoverSource,
  ITerrainSource,
  WeatherComponent,
} from "@modules/risk/domain/fire-risk.js";
import { fuelFor } from "@modules/risk/domain/fuel-table.js";
import {
  FORMULA_DYNAMIC,
  FORMULA_STATIC,
  hazardScore,
  levelFor,
  slopeFactor,
  weatherFactor,
} from "@modules/risk/domain/risk-formula.js";

/** Fire hazard at a point = weather × fuel × slope (see risk-formula.ts). */
@injectable()
export class AssessFireRisk {
  constructor(
    @inject(TOKENS.TerrainSource) private readonly terrain: ITerrainSource,
    @inject(TOKENS.LandCoverSource)
    private readonly landCover: ILandCoverSource,
    @inject(TOKENS.FireWeatherSource)
    private readonly fireWeather: IFireWeatherSource,
  ) {}

  async execute(point: Coordinates): Promise<FireRiskAssessment> {
    const [terrain, cover, weatherSample] = await Promise.all([
      this.terrain.sample(point),
      this.landCover.sample(point),
      this.fireWeather.sample(point),
    ]);

    const fuel = fuelFor(cover.worldCoverClass);
    const weather: WeatherComponent = weatherSample
      ? {
          available: true,
          factor: Math.round(weatherFactor(weatherSample.fwi) * 1000) / 1000,
          ...weatherSample,
        }
      : { available: false, reason: "Fire Weather Index unavailable" };

    const score = hazardScore(
      fuel.flammability,
      terrain.slopeDeg,
      weather.available ? weather.factor : null,
    );

    return {
      location: point,
      score,
      level: levelFor(score),
      mode: weather.available ? "dynamic" : "static",
      components: {
        weather,
        fuel: { ...cover, ...fuel },
        terrain: {
          ...terrain,
          slopeFactor: Math.round(slopeFactor(terrain.slopeDeg) * 100) / 100,
        },
      },
      formula: weather.available ? FORMULA_DYNAMIC : FORMULA_STATIC,
    };
  }
}
