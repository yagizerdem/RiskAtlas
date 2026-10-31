import { registry } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import { AssessFireRisk } from "@modules/risk/application/assess-fire-risk.js";
import { CopernicusDemTerrain } from "@modules/risk/infrastructure/sources/copernicus-dem-terrain.js";
import { EsaWorldCoverLandCover } from "@modules/risk/infrastructure/sources/esa-worldcover-land-cover.js";
import { OpenMeteoComputedFireWeather } from "@modules/risk/infrastructure/sources/open-meteo-computed-fire-weather.js";

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
    // FWI computed from Open-Meteo weather. To use OpenWeather's FWI API once
    // access is granted, switch to OpenWeatherFireWeather.
    token: TOKENS.FireWeatherSource,
    useClass: OpenMeteoComputedFireWeather,
  },
  {
    token: TOKENS.AssessFireRisk,
    useClass: AssessFireRisk,
  },
])
export class RiskRegistry {}
