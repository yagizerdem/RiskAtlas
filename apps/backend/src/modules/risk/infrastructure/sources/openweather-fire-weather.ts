import { inject, injectable } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import { ILogger } from "@core/logging/ILogger.js";
import {
  Coordinates,
  FireWeatherSample,
  IFireWeatherSource,
} from "@modules/risk/domain/fire-risk.js";

const FWI_URL = "https://api.openweathermap.org/data/2.5/fwi";

type FwiResponse = {
  list?: {
    main?: { fwi?: number };
    danger_rating?: { description?: string; value?: number };
  }[];
};

/**
 * OpenWeather Fire Weather Index API. Access must be granted by OpenWeather
 * by email; until then it answers 401 and the risk falls back to static mode.
 */
@injectable()
export class OpenWeatherFireWeather implements IFireWeatherSource {
  constructor(@inject(TOKENS.Logger) private readonly logger: ILogger) {}

  async sample({ lat, lon }: Coordinates): Promise<FireWeatherSample | null> {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      this.logger.warn("OPENWEATHER_API_KEY is not set", {
        context: "FireWeather",
      });
      return null;
    }

    const url = `${FWI_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    } catch (err) {
      this.logger.warn(`OpenWeather FWI request failed: ${String(err)}`, {
        context: "FireWeather",
      });
      return null;
    }
    if (!res.ok) {
      this.logger.warn(`OpenWeather FWI responded ${res.status}`, {
        context: "FireWeather",
      });
      return null;
    }

    const body = (await res.json()) as FwiResponse;
    const entry = body.list?.[0];
    if (entry?.main?.fwi === undefined) return null;

    return {
      fwi: entry.main.fwi,
      dangerClass: entry.danger_rating?.value ?? 0,
      dangerLabel: entry.danger_rating?.description ?? "unknown",
      source: "OpenWeather Fire Weather Index API",
    };
  }
}
