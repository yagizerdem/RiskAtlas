import { registry } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import { AssessFireRisk } from "@modules/risk/application/assess-fire-risk.js";
import { CopernicusDemTerrain } from "@modules/risk/infrastructure/sources/copernicus-dem-terrain.js";
import { EsaWorldCoverLandCover } from "@modules/risk/infrastructure/sources/esa-worldcover-land-cover.js";
import { OpenWeatherFireWeather } from "@modules/risk/infrastructure/sources/openweather-fire-weather.js";

@registry([
  {
    token: TOKENS.TerrainSource,
    useClass: CopernicusDemTerrain,
  },
  {
    token: TOKENS.LandCoverSource,
    useClass: EsaWorldCoverLandCover,
  },
  {
    token: TOKENS.FireWeatherSource,
    useClass: OpenWeatherFireWeather,
  },
  {
    token: TOKENS.AssessFireRisk,
    useClass: AssessFireRisk,
  },
])
export class RiskRegistry {}
