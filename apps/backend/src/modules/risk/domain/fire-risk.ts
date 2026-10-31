export type Coordinates = { lat: number; lon: number };

export type TerrainSample = {
  /** null when the point has no DEM coverage (open sea) */
  elevationM: number | null;
  slopeDeg: number;
};

export type LandCoverSample = {
  /** ESA WorldCover class code (10 = tree cover, 20 = shrubland, ...) */
  worldCoverClass: number;
};

export type FireWeatherSample = {
  /** Canadian Fire Weather Index */
  fwi: number;
  /** EFFIS / OpenWeather danger rating, 0 (very low) .. 5 (extreme) */
  dangerClass: number;
  dangerLabel: string;
  /** where the value comes from, shown to the user */
  source: string;
};

export type WeatherComponent =
  | ({ available: true; factor: number } & FireWeatherSample)
  | { available: false; reason: string };

export type RiskLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

export type FireRiskAssessment = {
  location: Coordinates;
  /** 0..100 */
  score: number;
  level: RiskLevel;
  /** dynamic = weather included, static = fuel and slope only */
  mode: "dynamic" | "static";
  components: {
    weather: WeatherComponent;
    fuel: LandCoverSample & { label: string; flammability: number };
    terrain: TerrainSample & { slopeFactor: number };
  };
  formula: string;
};

export interface ITerrainSource {
  sample(point: Coordinates): Promise<TerrainSample>;
}

export interface ILandCoverSource {
  sample(point: Coordinates): Promise<LandCoverSample>;
}

export interface IFireWeatherSource {
  /** returns null when weather data is unavailable (no key, no access) */
  sample(point: Coordinates): Promise<FireWeatherSample | null>;
}
