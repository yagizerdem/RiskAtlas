// Derives how often each land cover × slope combination burns in Turkey, from real
// burnt areas, and writes src/modules/risk/domain/burn-rates.json.
//
//   burn ratio = share of burnt area in the cell / share of Turkey's land area in the cell
//   (1 = burns as often as the Turkish average, 5 = five times as often)
//
// Data (all public, downloaded on each run):
// - EFFIS burnt areas (MODIS, mapped fire perimeters), Turkey, 2022-2025 (WFS).
//   2021 is left out: WorldCover 2021 is built from 2021 imagery, so 2021 burns
//   may already show as burnt land instead of their pre-fire cover.
// - ESA WorldCover 2021, overview level 4 (3°/2250 px ≈ 148 m).
// - Copernicus DEM GLO-30, overview level 2 (1°/900 px ≈ 111 m), slope by Horn.
// - Natural Earth 1:50m admin-0 border of Turkey (land mask).
// Slope classes follow Akay (2020, Karacabey): 0-5, 5-15, 15-25, 25-35, >35 %.
// A class × slope cell is used only with at least MIN_BURNED burnt pixels
// (Poisson relative error 1/√n ≤ 20 %); otherwise the class-wide ratio is used.
//
// Hold-out check: the table is also built from 2022-2024 only, and 2025 burns are
// scored against it (share of 2025 burnt area per level; 20 % each = no skill).
//
// Run from apps/backend:  node scripts/risk/derive-burn-rates.mjs
import { writeFileSync, readFileSync } from "node:fs";
import { fromUrl } from "geotiff";

const YEARS = [2022, 2023, 2024, 2025];
const WC_BASE = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map";
const DEM_BASE = "https://copernicus-dem-30m.s3.amazonaws.com";
const NE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const EFFIS_WFS = "https://maps.effis.emergency.copernicus.eu/effis";
const WC_OVERVIEW = 4;
const DEM_OVERVIEW = 2;
const SLOPE_BINS_PCT = [5, 15, 25, 35];
const MIN_BURNED = 25;
const HOLDOUT_YEAR = 2025;
const METERS_PER_DEGREE = 111_320;
const OUT = new URL("../../src/modules/risk/domain/burn-rates.json", import.meta.url);
const DEM_INDEX = new URL("../../../../data/tif.json", import.meta.url);

const log = (...a) => console.error(...a);

// ---------- geometry helpers ----------
function rings(geometry) {
  return geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
}
// longitudes where polygon edges cross latitude y (even-odd rule)
function crossings(polys, y) {
  const xs = [];
  for (const poly of polys) for (const ring of poly) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[j];
      if ((y1 > y) !== (y2 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  return xs.sort((a, b) => a - b);
}
function insideSorted(x, xs) { let n = 0; while (n < xs.length && xs[n] < x) n++; return n % 2 === 1; }

export function slopeBin(slopeDeg) {
  const pct = Math.tan((slopeDeg * Math.PI) / 180) * 100;
  const i = SLOPE_BINS_PCT.findIndex((upper) => pct < upper);
  return i === -1 ? SLOPE_BINS_PCT.length : i;
}

// ---------- inputs ----------
log("Natural Earth border…");
const ne = await (await fetch(NE_URL)).json();
const turkey = rings(ne.features.find((f) => f.properties.ADM0_A3 === "TUR").geometry);

log("EFFIS burnt areas…");
const burns = [];
const reported = { fires: 0, ha: 0 };
for (const y of YEARS) {
  const url = `${EFFIS_WFS}?service=WFS&version=2.0.0&request=GetFeature&typeName=ms:modis.ba.poly.${y}` +
    `&outputFormat=geojson&srsName=EPSG:4326&bbox=35.8,25.6,42.2,44.9,urn:ogc:def:crs:EPSG::4326`;
  const fc = await (await fetch(url)).json();
  for (const f of fc.features) {
    if (f.properties.COUNTRY !== "TR") continue;
    reported.fires++; reported.ha += Number(f.properties.AREA_HA);
    const polys = rings(f.geometry);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const poly of polys) for (const [x, yy] of poly[0]) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, yy); maxY = Math.max(maxY, yy);
    }
    burns.push({ year: y, polys, minX, maxX, minY, maxY });
  }
  log(" ", y, "done");
}

const demIndex = new Set(
  JSON.parse(readFileSync(DEM_INDEX, "utf8")).map((e) =>
    `${(e.latitudeDirection === "N" ? 1 : -1) * Number(e.latitudeValue)},${(e.longitudeDirection === "E" ? 1 : -1) * Number(e.longitudeValue)}`),
);
const demCache = new Map();
async function demTile(lat0, lon0) {
  const key = `${lat0},${lon0}`;
  if (!demIndex.has(key)) return null;
  if (!demCache.has(key)) {
    const name = `Copernicus_DSM_COG_10_N${String(lat0).padStart(2, "0")}_00_E${String(lon0).padStart(3, "0")}_00_DEM`;
    const img = await (await fromUrl(`${DEM_BASE}/${name}/${name}.tif`)).getImage(DEM_OVERVIEW);
    demCache.set(key, { data: (await img.readRasters())[0], size: img.getWidth() });
  }
  return demCache.get(key);
}

// slope (degrees) at a point from the DEM overview, Horn over the 3×3 neighbourhood
function slopeAt(dem, lat0, lon0, lat, lon) {
  const n = dem.size, step = 1 / n;
  const r = Math.min(Math.max(Math.floor((lat0 + 1 - lat) / step), 1), n - 2);
  const c = Math.min(Math.max(Math.floor((lon - lon0) / step), 1), n - 2);
  const z = (dr, dc) => dem.data[(r + dr) * n + (c + dc)];
  const cellY = step * METERS_PER_DEGREE;
  const cellX = cellY * Math.cos((lat * Math.PI) / 180);
  const dzdx = (z(-1, 1) + 2 * z(0, 1) + z(1, 1) - (z(-1, -1) + 2 * z(0, -1) + z(1, -1))) / (8 * cellX);
  const dzdy = (z(1, -1) + 2 * z(1, 0) + z(1, 1) - (z(-1, -1) + 2 * z(-1, 0) + z(-1, 1))) / (8 * cellY);
  return (Math.atan(Math.hypot(dzdx, dzdy)) * 180) / Math.PI;
}

// ---------- counting ----------
const NB = SLOPE_BINS_PCT.length + 1; // last slot = no DEM coverage
const NY = YEARS.length;
// class -> { area:[NB], burned:[NY][NB] }
const cells = new Map();
const cell = (v) => {
  if (!cells.has(v)) cells.set(v, { area: Array(NB + 1).fill(0), burned: YEARS.map(() => Array(NB + 1).fill(0)) });
  return cells.get(v);
};
let landPx = 0;

for (let lat0 = 33; lat0 <= 42; lat0 += 3) {
  for (let lon0 = 24; lon0 <= 42; lon0 += 3) {
    const name = `ESA_WorldCover_10m_2021_v200_N${lat0}E0${String(lon0).padStart(2, "0")}_Map.tif`;
    let img;
    try { img = await (await fromUrl(`${WC_BASE}/${name}`)).getImage(WC_OVERVIEW); }
    catch { log("  no tile", name); continue; }
    const size = img.getWidth(), step = 3 / size;
    const wc = (await img.readRasters())[0];

    // burnt pixel counts inside this tile (a pixel burnt in two years counts twice)
    const burnt = new Map();
    for (const b of burns) {
      if (b.maxX < lon0 || b.minX > lon0 + 3 || b.maxY < lat0 || b.minY > lat0 + 3) continue;
      const r0 = Math.max(Math.floor((lat0 + 3 - b.maxY) / step), 0), r1 = Math.min(Math.ceil((lat0 + 3 - b.minY) / step), size - 1);
      const c0 = Math.max(Math.floor((b.minX - lon0) / step), 0), c1 = Math.min(Math.ceil((b.maxX - lon0) / step), size - 1);
      for (let r = r0; r <= r1; r++) {
        const xs = crossings(b.polys, lat0 + 3 - (r + 0.5) * step);
        if (!xs.length) continue;
        for (let c = c0; c <= c1; c++) {
          if (!insideSorted(lon0 + (c + 0.5) * step, xs)) continue;
          const idx = r * size + c;
          if (!burnt.has(idx)) burnt.set(idx, Array(YEARS.length).fill(0));
          burnt.get(idx)[YEARS.indexOf(b.year)]++;
        }
      }
    }

    for (let r = 0; r < size; r++) {
      const lat = lat0 + 3 - (r + 0.5) * step;
      const xs = crossings(turkey, lat);
      if (!xs.length) continue;
      const demLat0 = Math.floor(lat);
      for (let c = 0; c < size; c++) {
        const lon = lon0 + (c + 0.5) * step;
        if (!insideSorted(lon, xs)) continue;
        const v = wc[r * size + c];
        if (!v) continue;
        landPx++;
        const dem = await demTile(demLat0, Math.floor(lon));
        const bin = dem ? slopeBin(slopeAt(dem, demLat0, Math.floor(lon), lat, lon)) : NB;
        const k = cell(v);
        k.area[bin]++;
        const perYear = burnt.get(r * size + c);
        if (perYear) perYear.forEach((n, yi) => { k.burned[yi][bin] += n; });
      }
    }
    log("  tile", name, "done");
    demCache.clear();
  }
}

// ---------- ratios ----------
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/** Builds the lookup table from the burns of the given years. */
function buildTable(years) {
  const yi = years.map((y) => YEARS.indexOf(y));
  const burnedOf = (k, bin) => sum(yi.map((i) => k.burned[i][bin]));
  let burnedTotal = 0;
  for (const k of cells.values()) for (let b = 0; b <= NB; b++) burnedTotal += burnedOf(k, b);
  const ratio = (burned, area) => (area === 0 ? null : burned / burnedTotal / (area / landPx));

  const classes = {};
  for (const [v, k] of [...cells].sort((a, b) => a[0] - b[0])) {
    const area = sum(k.area), burned = sum(Array.from({ length: NB + 1 }, (_, b) => burnedOf(k, b)));
    const classRatio = ratio(burned, area);
    classes[v] = {
      areaPx: area, burnedPx: burned, ratio: classRatio,
      bySlope: Array.from({ length: NB }, (_, b) => {
        const bBurned = burnedOf(k, b), r = ratio(bBurned, k.area[b]);
        return { areaPx: k.area[b], burnedPx: bBurned, ratio: r, used: bBurned >= MIN_BURNED ? r : classRatio };
      }),
    };
  }
  return { classes, burnedTotal };
}
const effective = (table, v, bin) => (bin === NB ? table.classes[v].ratio : table.classes[v].bySlope[bin].used);

/** Area quintiles of Turkey's land on the effective ratio: each level = 20 % of the land. */
function quintiles(table) {
  const flat = [];
  for (const [v, k] of cells) for (let b = 0; b <= NB; b++) if (k.area[b]) flat.push({ r: effective(table, v, b) ?? 0, a: k.area[b] });
  flat.sort((x, y) => x.r - y.r);
  const out = []; let acc = 0, next = 0.2;
  for (const x of flat) { acc += x.a; while (acc / landPx >= next && out.length < 4) { out.push(x.r); next += 0.2; } }
  return out;
}
const levelOf = (r, thresholds) => { const i = thresholds.findIndex((t) => r < t); return i === -1 ? 4 : i; };

// hold-out: thresholds and ratios from the other years, scored on HOLDOUT_YEAR burns
const train = buildTable(YEARS.filter((y) => y !== HOLDOUT_YEAR));
const trainQ = quintiles(train);
const hy = YEARS.indexOf(HOLDOUT_YEAR);
const holdout = [0, 0, 0, 0, 0];
const holdoutLand = [0, 0, 0, 0, 0]; // no-skill baseline: land share of each level
for (const [v, k] of cells) for (let b = 0; b <= NB; b++) {
  const level = levelOf(effective(train, v, b) ?? 0, trainQ);
  holdoutLand[level] += k.area[b];
  if (k.burned[hy][b]) holdout[level] += k.burned[hy][b];
}
const holdoutTotal = sum(holdout);

const table = buildTable(YEARS);
const levelThresholds = quintiles(table);

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  method: "burn ratio = burnt-area share / land-area share of the cell; Turkey (Natural Earth 1:50m), EFFIS MODIS burnt areas, ESA WorldCover 2021 (≈148 m), Copernicus DEM slope (≈111 m, Horn). Cells with fewer than minBurnedPx burnt pixels use the class ratio.",
  years: YEARS,
  slopeBinsPct: SLOPE_BINS_PCT,
  minBurnedPx: MIN_BURNED,
  reported: { fires: reported.fires, ha: Math.round(reported.ha) },
  pixels: { land: landPx, burned: table.burnedTotal },
  levelThresholds: { basis: "area quintiles of Turkey's land (each level = 20 %)", values: levelThresholds },
  holdout: {
    trainYears: YEARS.filter((y) => y !== HOLDOUT_YEAR),
    testYear: HOLDOUT_YEAR,
    thresholds: trainQ,
    burnedPxShareByLevel: holdout.map((n) => n / holdoutTotal),
    landShareByLevel: holdoutLand.map((n) => n / landPx),
    note: "share of test-year burnt area per level (very low → very high) vs the land share of that level; equal shares would mean no skill",
  },
  classes: table.classes,
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
log("written", OUT.pathname);
console.log(JSON.stringify({ reported: out.reported, pixels: out.pixels, levelThresholds: out.levelThresholds, holdout: out.holdout }, null, 1));
for (const [v, k] of Object.entries(table.classes)) {
  console.log(v, "ratio", k.ratio?.toFixed(3), "| by slope", k.bySlope.map((s) => (s.ratio === null ? "-" : `${s.ratio.toFixed(2)}(${s.burnedPx})${s.used === s.ratio ? "" : "→" + s.used?.toFixed(2)}`)).join(" "));
}
