import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dangerClassFor,
  fwiSeries,
  type DailyWeather,
} from "../../src/modules/risk/domain/fwi-calculator.js";

/**
 * data/cffdrs-fwi-01.csv is the expected output of the Canadian Forest Service
 * reference code (cffdrs R package, tests/testthat/data/fwi_01.csv): fwi() on
 * the Van Wagner & Pickett (1985) standard test weather, 48 days from start-up
 * values FFMC 85, DMC 6, DC 15. Values are stored with 4 significant digits.
 */
const rows = readFileSync(
  new URL("./data/cffdrs-fwi-01.csv", import.meta.url),
  "utf8",
)
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.split(",").map(Number));

test("matches cffdrs reference output for all 48 days", () => {
  const days: DailyWeather[] = rows.map((r) => ({
    lat: r[1]!,
    month: r[3]!,
    tempC: r[5]!,
    rhPct: r[6]!,
    windKmh: r[7]!,
    rainMm: r[8]!,
  }));
  const keys = ["ffmc", "dmc", "dc", "isi", "bui", "fwi"] as const;

  fwiSeries(days).forEach((day, i) => {
    keys.forEach((key, j) => {
      const expected = rows[i]![9 + j]!;
      assert.ok(
        Math.abs(day[key] - expected) <= 0.006,
        `day ${i + 1} ${key}: got ${day[key].toFixed(4)}, expected ${expected}`,
      );
    });
  });
});

test("danger classes follow EFFIS thresholds", () => {
  assert.equal(dangerClassFor(0).label, "very low");
  assert.equal(dangerClassFor(5.2).label, "low");
  assert.equal(dangerClassFor(21.29).label, "moderate");
  assert.equal(dangerClassFor(38).label, "very high");
  assert.equal(dangerClassFor(50).value, 5);
});

test("long dry hot spell drives FWI up, heavy rain brings it down", () => {
  const dry = Array.from({ length: 60 }, () => ({
    tempC: 33, rhPct: 20, windKmh: 20, rainMm: 0, month: 8, lat: 38,
  }));
  const afterDry = fwiSeries(dry).at(-1)!;
  assert.ok(afterDry.fwi > 38, `expected very high FWI, got ${afterDry.fwi}`);

  const wet = fwiSeries(
    [{ tempC: 18, rhPct: 90, windKmh: 5, rainMm: 40, month: 9, lat: 38 }],
    afterDry,
  ).at(-1)!;
  assert.ok(wet.ffmc < 40 && wet.fwi < 2, `rain should reset fine fuels: ${JSON.stringify(wet)}`);
});
