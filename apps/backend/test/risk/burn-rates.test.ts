import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BURN_RATES,
  burnRatio,
  slopeBin,
  structuralLevel,
} from "../../src/modules/risk/domain/burn-rates.js";

const deg = (pct: number) => (Math.atan(pct / 100) * 180) / Math.PI;

test("slope classes follow Akay (2020): 0-5, 5-15, 15-25, 25-35, >35 %", () => {
  assert.deepEqual(BURN_RATES.slopeBinsPct, [5, 15, 25, 35]);
  assert.equal(slopeBin(0), 0);
  assert.equal(slopeBin(deg(4.99)), 0);
  assert.equal(slopeBin(deg(5.01)), 1);
  assert.equal(slopeBin(deg(24.99)), 2);
  assert.equal(slopeBin(deg(35.01)), 4);
  assert.equal(slopeBin(60), 4);
});

test("burn ratio comes from the generated table, per class and slope", () => {
  const tree = BURN_RATES.classes["10"]!;
  // tree cover at 10 % slope: enough burnt pixels, so the cell's own ratio is used
  assert.ok(tree.bySlope[1]!.burnedPx >= BURN_RATES.minBurnedPx);
  assert.equal(burnRatio(10, deg(10)), tree.bySlope[1]!.ratio);
  // no DEM (slope unknown) -> class ratio
  assert.equal(burnRatio(10, null), tree.ratio);
  // class absent from Turkey's land -> null
  assert.equal(burnRatio(95, 0), null);
});

test("cells with too few burnt pixels fall back to the class ratio", () => {
  for (const [code, entry] of Object.entries(BURN_RATES.classes)) {
    entry.bySlope.forEach((cell, bin) => {
      const expected = cell.burnedPx >= BURN_RATES.minBurnedPx ? cell.ratio : entry.ratio;
      assert.equal(cell.used, expected, `class ${code} bin ${bin}`);
    });
  }
});

test("table is internally consistent with Turkey's land and EFFIS area", () => {
  // land pixels × pixel area (3°/2250 × 111.32 km, cos 39°) ≈ Turkey's 783,562 km²
  const pxKm2 = (3 / 2250) * 111.32 * ((3 / 2250) * 111.32 * Math.cos((39 * Math.PI) / 180));
  const landKm2 = (BURN_RATES as any).pixels.land * pxKm2;
  assert.ok(Math.abs(landKm2 - 783_562) / 783_562 < 0.02, `land ${Math.round(landKm2)} km²`);
  // burnt pixels × pixel area ≈ EFFIS reported hectares
  const burntHa = (BURN_RATES as any).pixels.burned * pxKm2 * 100;
  const reportedHa = (BURN_RATES as any).reported.ha;
  assert.ok(Math.abs(burntHa - reportedHa) / reportedHa < 0.05, `burnt ${Math.round(burntHa)} ha vs ${reportedHa}`);
});

test("levels are Turkey land area quintiles", () => {
  const [q1, q2, q3, q4] = BURN_RATES.levelThresholds.values as [number, number, number, number];
  assert.equal(structuralLevel(q1 - 1e-9), "very_low");
  assert.equal(structuralLevel(q1), "low");
  assert.equal(structuralLevel(q2), "moderate");
  assert.equal(structuralLevel(q3), "high");
  assert.equal(structuralLevel(q4), "very_high");
});
