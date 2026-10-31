/**
 * Canadian Forest Fire Weather Index (FWI) System.
 *
 * Equations from Van Wagner (1987) "Development and structure of the Canadian
 * Forest Fire Weather Index System" and Van Wagner & Pickett (1985), written to
 * match the Canadian Forest Service reference code cffdrs (R package, incl. its
 * FFMC coefficient and latitude-adjusted day lengths). Checked against the
 * cffdrs test output in test/risk/fwi-calculator.test.ts.
 *
 * Inputs are noon local standard time observations:
 * temperature (°C), relative humidity (%), 10 m wind (km/h), 24 h rain (mm).
 */

export type DailyWeather = {
  tempC: number;
  rhPct: number;
  windKmh: number;
  rainMm: number;
  /** 1..12 */
  month: number;
  /** latitude in degrees, selects the day-length table */
  lat: number;
};

export type FwiState = { ffmc: number; dmc: number; dc: number };

export type FwiDay = FwiState & { isi: number; bui: number; fwi: number };

/** Standard start-up values after the wet season (Van Wagner 1987). */
export const FWI_STARTUP: FwiState = { ffmc: 85, dmc: 6, dc: 15 };

/** 250 × 59.5 / 101 ≈ 147.2772 (cffdrs; Van Wagner 1987 rounds it to 147.2) */
const FFMC_COEFFICIENT = (250 * 59.5) / 101;

/** DMC effective day-length by month, per latitude band (cffdrs) */
const DMC_DAY_LENGTH = {
  north: [6.5, 7.5, 9, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8, 7, 6], // lat > 30
  northSub: [7.9, 8.4, 8.9, 9.5, 9.9, 10.2, 10.1, 9.7, 9.1, 8.6, 8.1, 7.8], // 10..30
  southSub: [10.1, 9.6, 9.1, 8.5, 8.1, 7.8, 7.9, 8.3, 8.9, 9.4, 9.9, 10.2], // -30..-10
  south: [11.5, 10.5, 9.2, 7.9, 6.8, 6.2, 6.5, 7.4, 8.7, 10, 11.2, 11.8], // < -30
};
/** DC day-length adjustment by month (cffdrs) */
const DC_DAY_LENGTH = {
  north: [-1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5, 2.4, 0.4, -1.6, -1.6], // lat > 20
  south: [6.4, 5, 2.4, 0.4, -1.6, -1.6, -1.6, -1.6, -1.6, 0.9, 3.8, 5.8], // lat <= -20
};

function dmcDayLength(lat: number, month: number): number {
  if (lat > 10 && lat <= 30) return DMC_DAY_LENGTH.northSub[month - 1]!;
  if (lat > -10 && lat <= 10) return 9;
  if (lat > -30 && lat <= -10) return DMC_DAY_LENGTH.southSub[month - 1]!;
  if (lat <= -30) return DMC_DAY_LENGTH.south[month - 1]!;
  return DMC_DAY_LENGTH.north[month - 1]!;
}

function dcDayLength(lat: number, month: number): number {
  if (lat > -20 && lat <= 20) return 1.4;
  if (lat <= -20) return DC_DAY_LENGTH.south[month - 1]!;
  return DC_DAY_LENGTH.north[month - 1]!;
}

/** Fine Fuel Moisture Code: litter and fine fuels, reacts within hours. */
export function nextFfmc(ffmc0: number, w: DailyWeather): number {
  const { tempC: t, rhPct: h, windKmh: ws, rainMm: ro } = w;
  let mo = (FFMC_COEFFICIENT * (101 - ffmc0)) / (59.5 + ffmc0);

  if (ro > 0.5) {
    const rf = ro - 0.5;
    let mr =
      mo + 42.5 * rf * Math.exp(-100 / (251 - mo)) * (1 - Math.exp(-6.93 / rf));
    if (mo > 150) mr += 0.0015 * (mo - 150) ** 2 * Math.sqrt(rf);
    mo = Math.min(mr, 250);
  }

  const ed =
    0.942 * h ** 0.679 +
    11 * Math.exp((h - 100) / 10) +
    0.18 * (21.1 - t) * (1 - Math.exp(-0.115 * h));

  let m: number;
  if (mo > ed) {
    // drying
    const ko =
      0.424 * (1 - (h / 100) ** 1.7) +
      0.0694 * Math.sqrt(ws) * (1 - (h / 100) ** 8);
    const kd = ko * 0.581 * Math.exp(0.0365 * t);
    m = ed + (mo - ed) * 10 ** -kd;
  } else {
    const ew =
      0.618 * h ** 0.753 +
      10 * Math.exp((h - 100) / 10) +
      0.18 * (21.1 - t) * (1 - Math.exp(-0.115 * h));
    if (mo < ew) {
      // wetting from humid air
      const k1 =
        0.424 * (1 - ((100 - h) / 100) ** 1.7) +
        0.0694 * Math.sqrt(ws) * (1 - ((100 - h) / 100) ** 8);
      const kw = k1 * 0.581 * Math.exp(0.0365 * t);
      m = ew - (ew - mo) * 10 ** -kw;
    } else {
      m = mo;
    }
  }

  const ffmc = (59.5 * (250 - m)) / (FFMC_COEFFICIENT + m);
  return Math.min(Math.max(ffmc, 0), 101);
}

/** Duff Moisture Code: loosely compacted organic layer, reacts within ~2 weeks. */
export function nextDmc(dmc0: number, w: DailyWeather): number {
  const t = Math.max(w.tempC, -1.1);
  const rk =
    1.894 * (t + 1.1) * (100 - w.rhPct) * dmcDayLength(w.lat, w.month) * 1e-4;

  let pr = dmc0;
  if (w.rainMm > 1.5) {
    const re = 0.92 * w.rainMm - 1.27;
    const mo = 20 + 280 / Math.exp(0.023 * dmc0);
    const b =
      dmc0 <= 33
        ? 100 / (0.5 + 0.3 * dmc0)
        : dmc0 <= 65
          ? 14 - 1.3 * Math.log(dmc0)
          : 6.2 * Math.log(dmc0) - 17.2;
    const mr = mo + (1000 * re) / (48.77 + b * re);
    pr = Math.max(43.43 * (5.6348 - Math.log(mr - 20)), 0);
  }

  return Math.max(pr + rk, 0);
}

/** Drought Code: deep compact organic layer, reacts over ~2 months. */
export function nextDc(dc0: number, w: DailyWeather): number {
  const t = Math.max(w.tempC, -2.8);
  const pe = Math.max(
    (0.36 * (t + 2.8) + dcDayLength(w.lat, w.month)) / 2,
    0,
  );

  let dr = dc0;
  if (w.rainMm > 2.8) {
    const rd = 0.83 * w.rainMm - 1.27;
    const qo = 800 * Math.exp(-dc0 / 400);
    const qr = qo + 3.937 * rd;
    dr = Math.max(400 * Math.log(800 / qr), 0);
  }

  return Math.max(dr + pe, 0);
}

/** Initial Spread Index: expected rate of spread (fine fuels + wind). */
export function initialSpreadIndex(ffmc: number, windKmh: number): number {
  const fm = (FFMC_COEFFICIENT * (101 - ffmc)) / (59.5 + ffmc);
  const sf = 19.115 * Math.exp(-0.1386 * fm) * (1 + fm ** 5.31 / 4.93e7);
  return sf * Math.exp(0.05039 * windKmh);
}

/** Buildup Index: total fuel available for combustion (DMC + DC). */
export function buildupIndex(dmc: number, dc: number): number {
  if (dmc === 0 && dc === 0) return 0;
  const bui =
    dmc <= 0.4 * dc
      ? (0.8 * dc * dmc) / (dmc + 0.4 * dc)
      : dmc -
        (1 - (0.8 * dc) / (dmc + 0.4 * dc)) * (0.92 + (0.0114 * dmc) ** 1.7);
  return Math.max(bui, 0);
}

/** Fire Weather Index: fire intensity from spread (ISI) and fuel (BUI). */
export function fireWeatherIndex(isi: number, bui: number): number {
  const fd =
    bui <= 80
      ? 0.626 * bui ** 0.809 + 2
      : 1000 / (25 + 108.64 * Math.exp(-0.023 * bui));
  const b = 0.1 * isi * fd;
  return b > 1 ? Math.exp(2.72 * (0.434 * Math.log(b)) ** 0.647) : b;
}

/** One day of the system: yesterday's codes + today's noon weather. */
export function fwiStep(prev: FwiState, w: DailyWeather): FwiDay {
  const ffmc = nextFfmc(prev.ffmc, w);
  const dmc = nextDmc(prev.dmc, w);
  const dc = nextDc(prev.dc, w);
  const isi = initialSpreadIndex(ffmc, w.windKmh);
  const bui = buildupIndex(dmc, dc);
  return { ffmc, dmc, dc, isi, bui, fwi: fireWeatherIndex(isi, bui) };
}

/** Runs the codes day by day from start-up values; returns the last day. */
export function fwiSeries(
  days: DailyWeather[],
  start: FwiState = FWI_STARTUP,
): FwiDay[] {
  const out: FwiDay[] = [];
  let state = start;
  for (const w of days) {
    const day = fwiStep(state, w);
    out.push(day);
    state = day;
  }
  return out;
}

/** EFFIS / OpenWeather danger classes (upper bound excluded). */
const DANGER_CLASSES: [number, string][] = [
  [5.2, "very low"],
  [11.2, "low"],
  [21.3, "moderate"],
  [38, "high"],
  [50, "very high"],
  [Infinity, "extreme"],
];

export function dangerClassFor(fwi: number): { value: number; label: string } {
  const value = DANGER_CLASSES.findIndex(([upper]) => fwi < upper);
  return { value, label: DANGER_CLASSES[value]![1] };
}
