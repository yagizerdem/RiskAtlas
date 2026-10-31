export type Coordinates = { lat: number; lon: number };

export type TerrainSample = {
  /** null when the point has no DEM coverage (open sea, excluded tiles) */
  elevationM: number | null;
  /** null when the point has no DEM coverage */
  slopeDeg: number | null;
};

export type LandCoverSample = {
  /** ESA WorldCover class code (10 = tree cover, 20 = shrubland, ...) */
  worldCoverClass: number;
};

export type FireWeatherSample = {
  /** Canadian Fire Weather Index */
  fwi: number;
  /** EFFIS danger class, 0 (very low) .. 5 (extreme) */
  dangerClass: number;
  dangerLabel: string;
  /** day the value is for (YYYY-MM-DD) */
  date: string;
  /** where the value comes from, shown to the user */
  source: string;
};

export type RiskLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

export type FireRiskAssessment = {
  location: Coordinates;
  /**
   * Long-term: how often this land cover and slope burned in Turkey
   * (EFFIS burnt areas). Independent of the weather.
   */
  structural: {
    /** 1 = burns as often as the Turkish average; null = class not seen in Turkey */
    burnRatio: number | null;
    /** Turkey land area quintile; null when burnRatio is null */
    level: RiskLevel | null;
    landCover: LandCoverSample & { label: string };
    terrain: TerrainSample & { slopePct: number | null };
  };
  /** Day-specific fire weather danger (Canadian FWI, EFFIS classes) */
  weather:
    | ({ available: true } & FireWeatherSample)
    | { available: false; reason: string };
};

export interface ITerrainSource {
  sample(point: Coordinates): Promise<TerrainSample>;
}

export interface ILandCoverSource {
  sample(point: Coordinates): Promise<LandCoverSample>;
}

export interface IFireWeatherSource {
  /**
   * date = YYYY-MM-DD, defaults to today.
   * Returns null when weather data is unavailable for that day.
   */
  sample(point: Coordinates, date?: string): Promise<FireWeatherSample | null>;
}
