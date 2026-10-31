import { RiskLevel } from "@modules/risk/domain/fire-risk.js";

/** McArthur: rate of spread roughly doubles every 10° upslope, valid up to ~20°. */
export const MAX_SLOPE_DEG = 20;
export const MAX_SLOPE_FACTOR = 2 ** (MAX_SLOPE_DEG / 10);

/** FWI 50+ is the "extreme" class in the OpenWeather rating. */
export const FWI_EXTREME = 50;

export const FORMULA_DYNAMIC =
  "score = min(FWI, 50)/50 × flammability × 2^(min(slope°, 20)/10) / 4 × 100";
export const FORMULA_STATIC =
  "score = flammability × 2^(min(slope°, 20)/10) / 4 × 100 (no weather data)";

export function slopeFactor(slopeDeg: number): number {
  return 2 ** (Math.min(Math.max(slopeDeg, 0), MAX_SLOPE_DEG) / 10);
}

export function weatherFactor(fwi: number): number {
  return Math.min(Math.max(fwi, 0), FWI_EXTREME) / FWI_EXTREME;
}

/**
 * Multiplicative hazard: no fuel (sea, concrete) or calm weather gives a low
 * score on its own, without extra rules. weather = null means static mode.
 */
export function hazardScore(
  flammability: number,
  slopeDeg: number,
  weather: number | null,
): number {
  const raw =
    (weather ?? 1) * flammability * (slopeFactor(slopeDeg) / MAX_SLOPE_FACTOR);
  return Math.round(raw * 1000) / 10;
}

export function levelFor(score: number): RiskLevel {
  if (score < 10) return "very_low";
  if (score < 25) return "low";
  if (score < 45) return "moderate";
  if (score < 65) return "high";
  return "very_high";
}
