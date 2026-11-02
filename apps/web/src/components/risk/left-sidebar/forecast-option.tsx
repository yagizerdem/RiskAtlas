import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InfoIcon } from "lucide-react";

import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@components/ui/field";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip";
import {
  selectForecastOptions,
  setForecastOptions,
  type TFireForcastDangerSource,
  type TFWI,
} from "@store/slice/risk-map-slice";

const SOURCES: { value: TFireForcastDangerSource; label: string }[] = [
  { value: "ecmwf", label: "ECMWF (8 km res.)" },
  { value: "mf025", label: "Météo-France (10 km res.)" },
  { value: "nasa_geos5", label: "NASA GEOS-5" },
];

const FWI_INDICES: { label: string; value: TFWI["full_name"] }[] = [
  { label: "Fire Weather Index (FWI)", value: "FIRE_WEATHER_INDEX" },
  { label: "Initial Spread Index (ISI)", value: "INITIAL_SPREAD_INDEX" },
  { label: "Build Up Index (BUI)", value: "BUILD_UP_INDEX" },
  { label: "Fine Fuel Moisture Code (FFMC)", value: "FINE_FUEL_MOISTURE_CODE" },
  { label: "Duff Moisture Code (DMC)", value: "DUFF_MOISTURE_CODE" },
  { label: "Drought Code (DC)", value: "DROUGHT_CODE" },
  { label: "Anomaly (FWI)", value: "ANOMALY" },
  { label: "Ranking (FWI)", value: "RANKING" },
];
const FWI_BY_NAME: Record<TFWI["full_name"], TFWI> = {
  FIRE_WEATHER_INDEX: { full_name: "FIRE_WEATHER_INDEX", abbreviation: "FWI" },
  INITIAL_SPREAD_INDEX: {
    full_name: "INITIAL_SPREAD_INDEX",
    abbreviation: "ISI",
  },
  BUILD_UP_INDEX: { full_name: "BUILD_UP_INDEX", abbreviation: "BUI" },
  FINE_FUEL_MOISTURE_CODE: {
    full_name: "FINE_FUEL_MOISTURE_CODE",
    abbreviation: "FFMC",
  },
  DUFF_MOISTURE_CODE: { full_name: "DUFF_MOISTURE_CODE", abbreviation: "DMC" },
  DROUGHT_CODE: { full_name: "DROUGHT_CODE", abbreviation: "DC" },
  ANOMALY: { full_name: "ANOMALY", abbreviation: "FWI" },
  RANKING: { full_name: "RANKING", abbreviation: "FWI" },
};

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-muted-foreground"
            aria-label="More info"
          />
        }
      >
        <InfoIcon />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-56">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ForecastOption() {
  const [lightningEnabled, setLightningEnabled] = useState(false);
  const dispatch = useDispatch();
  const forecastOptions = useSelector(selectForecastOptions);
  const source = forecastOptions.fireDangerSource;
  const fireDangerEnabled = forecastOptions.showFireDangerForecast;
  const fwi: (typeof FWI_INDICES)[number] = FWI_INDICES.find(
    (item) => item.value === forecastOptions.fireWeatherIndex.full_name,
  )!;

  function handleFWIChange(value: TFWI["full_name"]) {
    dispatch(setForecastOptions({ fireWeatherIndex: FWI_BY_NAME[value] }));
  }

  return (
    <FieldSet>
      <FieldLegend variant="label">Forecasts</FieldLegend>

      <FieldGroup className="gap-4">
        <Field orientation="horizontal">
          <Checkbox
            id="fire-danger-forecast"
            checked={fireDangerEnabled}
            onCheckedChange={(checked) =>
              dispatch(
                setForecastOptions({
                  showFireDangerForecast: checked === true,
                }),
              )
            }
            className="cursor-pointer"
          />
          <FieldLabel
            htmlFor="fire-danger-forecast"
            className="text-xs font-semibold tracking-wide uppercase"
          >
            Fire danger forecast
          </FieldLabel>
          <InfoTip text="Daily fire danger forecast derived from numerical weather prediction models." />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="forecast-source" className="w-14 shrink-0">
            Source
          </FieldLabel>
          <FieldContent>
            <Select
              items={SOURCES}
              value={source}
              onValueChange={(value) =>
                value &&
                dispatch(
                  setForecastOptions({
                    fireDangerSource: value as TFireForcastDangerSource,
                  }),
                )
              }
            >
              <SelectTrigger id="forecast-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SOURCES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="forecast-index" className="w-14 shrink-0">
            Index
          </FieldLabel>
          <FieldContent>
            <Select
              items={FWI_INDICES}
              value={fwi.value}
              onValueChange={(value) => value && handleFWIChange(value)}
            >
              <SelectTrigger id="forecast-index" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FWI_INDICES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <FieldSeparator />

        <Field orientation="horizontal">
          <Checkbox
            id="lightning-forecast"
            checked={lightningEnabled}
            onCheckedChange={setLightningEnabled}
            className="cursor-pointer"
          />
          <FieldLabel
            htmlFor="lightning-forecast"
            className="text-xs font-semibold tracking-wide uppercase"
          >
            Lightning forecast
          </FieldLabel>
          <InfoTip text="Forecasted lightning activity, a major natural ignition source." />
        </Field>

        <FieldSeparator />
      </FieldGroup>
    </FieldSet>
  );
}
