import { inject, injectable } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import { ILogger } from "@core/logging/ILogger.js";
import {
  Coordinates,
  FireWeatherSample,
  IFireWeatherSource,
} from "@modules/risk/domain/fire-risk.js";
import {
  dangerClassFor,
  fwiSeries,
  type DailyWeather,
} from "@modules/risk/domain/fwi-calculator.js";

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const HOURLY = "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation";

/**
 * FWI codes carry over day to day (the Drought Code reacts over ~2 months), so
 * the season is run from 1 March with the standard start-up values: winter
 * rains in Turkey leave the fuels wet, which is what start-up values assume.
 */
const SEASON_START_MONTH = 3;

/** Open-Meteo grid is ~10 km; one weather series per 0.1° cell per hour. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 500;

type Hourly = {
  time: string[];
  temperature_2m: (number | null)[];
  relative_humidity_2m: (number | null)[];
  wind_speed_10m: (number | null)[];
  precipitation: (number | null)[];
};

/**
 * Builds one noon observation per day from hourly data: temperature, humidity
 * and wind at 12:00 local time, rain summed over the 24 h ending at 12:00.
 * Stops at the first day with missing values.
 */
export function noonObservations(hourly: Hourly, lat: number): {
  days: DailyWeather[];
  lastDate: string | null;
} {
  const days: DailyWeather[] = [];
  let lastDate: string | null = null;

  for (let i = 0; i < hourly.time.length; i++) {
    const time = hourly.time[i]!;
    if (!time.endsWith("T12:00")) continue;

    const tempC = hourly.temperature_2m[i];
    const rhPct = hourly.relative_humidity_2m[i];
    const windKmh = hourly.wind_speed_10m[i];
    const rain = hourly.precipitation.slice(Math.max(i - 23, 0), i + 1);
    if (tempC == null || rhPct == null || windKmh == null || rain.includes(null)) {
      break;
    }

    days.push({
      tempC,
      rhPct,
      windKmh,
      rainMm: (rain as number[]).reduce((sum, mm) => sum + mm, 0),
      month: Number(time.slice(5, 7)),
      lat,
    });
    lastDate = time.slice(0, 10);
  }

  return { days, lastDate };
}

function seasonStart(today: Date): string {
  const year =
    today.getUTCMonth() + 1 >= SEASON_START_MONTH
      ? today.getUTCFullYear()
      : today.getUTCFullYear() - 1;
  return `${year}-${String(SEASON_START_MONTH).padStart(2, "0")}-01`;
}

/**
 * Computes the Canadian FWI ourselves from Open-Meteo weather (free, no key).
 * Used while OpenWeather's FWI API access is not granted.
 */
@injectable()
export class OpenMeteoComputedFireWeather implements IFireWeatherSource {
  private readonly cache = new Map<
    string,
    { at: number; value: FireWeatherSample }
  >();

  constructor(@inject(TOKENS.Logger) private readonly logger: ILogger) {}

  async sample(
    { lat, lon }: Coordinates,
    date?: string,
  ): Promise<FireWeatherSample | null> {
    const target = date ?? new Date().toISOString().slice(0, 10);
    const cellLat = Math.round(lat * 10) / 10;
    const cellLon = Math.round(lon * 10) / 10;
    const key = `${cellLat},${cellLon},${target}`;

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

    const value = await this.compute(cellLat, cellLon, target);
    // keep failures uncached so a network glitch is retried on the next click
    if (value) {
      if (this.cache.size >= CACHE_MAX) this.cache.clear();
      this.cache.set(key, { at: Date.now(), value });
    }
    return value;
  }

  private async compute(
    lat: number,
    lon: number,
    target: string,
  ): Promise<FireWeatherSample | null> {
    const url =
      `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}` +
      `&start_date=${seasonStart(new Date(`${target}T00:00:00Z`))}&end_date=${target}` +
      `&hourly=${HOURLY}&timezone=auto`;

    let hourly: Hourly;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        this.logger.warn(`Open-Meteo responded ${res.status}`, {
          context: "FireWeather",
        });
        return null;
      }
      hourly = ((await res.json()) as { hourly: Hourly }).hourly;
    } catch (err) {
      this.logger.warn(`Open-Meteo request failed: ${String(err)}`, {
        context: "FireWeather",
      });
      return null;
    }

    const { days, lastDate } = noonObservations(hourly, lat);
    if (lastDate !== target) {
      this.logger.warn(`No complete noon weather for ${target}`, {
        context: "FireWeather",
      });
      return null;
    }

    const latest = fwiSeries(days).at(-1)!;
    const danger = dangerClassFor(latest.fwi);
    return {
      fwi: Math.round(latest.fwi * 10) / 10,
      dangerClass: danger.value,
      dangerLabel: danger.label,
      date: target,
      source: `Computed (Canadian FWI, cffdrs equations) from Open-Meteo weather, ${days.length} days to ${lastDate}`,
    };
  }
}
