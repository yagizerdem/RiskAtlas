/**
 * ESA WorldCover class -> flammability (0..1).
 *
 * v1 values are our own assumption: the ordering follows Mediterranean
 * literature (maquis and pine burn most, crops and bare land least), the exact
 * numbers are not taken from a source. Planned replacement: derive them from
 * NASA FIRMS fire history (burned share / area share per class).
 */
export const FUEL_TABLE: Record<number, { label: string; flammability: number }> =
  {
    10: { label: "Tree cover", flammability: 0.9 },
    20: { label: "Shrubland", flammability: 1.0 },
    30: { label: "Grassland", flammability: 0.7 },
    40: { label: "Cropland", flammability: 0.4 },
    50: { label: "Built-up", flammability: 0.05 },
    60: { label: "Bare / sparse vegetation", flammability: 0.1 },
    70: { label: "Snow and ice", flammability: 0 },
    80: { label: "Permanent water bodies", flammability: 0 },
    90: { label: "Herbaceous wetland", flammability: 0.3 },
    95: { label: "Mangroves", flammability: 0.3 },
    100: { label: "Moss and lichen", flammability: 0.2 },
  };

/** WorldCover uses 0 for "no data", which is open sea in practice. */
export const WATER_CLASS = 80;

export function fuelFor(worldCoverClass: number) {
  return (
    FUEL_TABLE[worldCoverClass] ?? { label: "Unknown", flammability: 0 }
  );
}
